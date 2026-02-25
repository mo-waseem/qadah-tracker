import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, saveProgress, type QadaStore, type QadaRange, type QadaData, legacyToRange } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays, eachDayOfInterval, getDay, parseISO } from "date-fns";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

// ─── Utilities ──────────────────────────────────────────────────────

/** Count Fridays (day index 5) between two ISO date strings, inclusive. */
export function countFridays(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter(d => getDay(d) === 5).length;
}

// ─── Aggregation helpers ────────────────────────────────────────────

export interface AggregatedQada {
  fajrCount: number;
  dhuhrCount: number;
  asrCount: number;
  maghribCount: number;
  ishaCount: number;
  fajrCompleted: number;
  dhuhrCompleted: number;
  asrCompleted: number;
  maghribCompleted: number;
  ishaCompleted: number;
}

export function aggregateRanges(ranges: QadaRange[]): AggregatedQada {
  return ranges.reduce<AggregatedQada>(
    (acc, r) => ({
      fajrCount: acc.fajrCount + r.fajrCount,
      dhuhrCount: acc.dhuhrCount + r.dhuhrCount,
      asrCount: acc.asrCount + r.asrCount,
      maghribCount: acc.maghribCount + r.maghribCount,
      ishaCount: acc.ishaCount + r.ishaCount,
      fajrCompleted: acc.fajrCompleted + r.fajrCompleted,
      dhuhrCompleted: acc.dhuhrCompleted + r.dhuhrCompleted,
      asrCompleted: acc.asrCompleted + r.asrCompleted,
      maghribCompleted: acc.maghribCompleted + r.maghribCompleted,
      ishaCompleted: acc.ishaCompleted + r.ishaCompleted,
    }),
    {
      fajrCount: 0, dhuhrCount: 0, asrCount: 0, maghribCount: 0, ishaCount: 0,
      fajrCompleted: 0, dhuhrCompleted: 0, asrCompleted: 0, maghribCompleted: 0, ishaCompleted: 0,
    },
  );
}

/** 
 * Waterfall distribution: Distributes a total count across ranges from oldest to newest.
 * Each range is filled to its max before moving to the next.
 */
function distributeCount(ranges: QadaRange[], prayer: string, targetTotal: number): QadaRange[] {
  const newRanges = [...ranges];
  const field = `${prayer}Completed` as keyof QadaRange;
  const countField = `${prayer}Count` as keyof QadaRange;

  let remainingTotal = targetTotal;

  for (let i = 0; i < newRanges.length; i++) {
    const range = { ...newRanges[i] };
    const maxForRange = Number(range[countField]);
    const assigned = Math.min(remainingTotal, maxForRange);

    (range as any)[field] = assigned;
    newRanges[i] = range;
    remainingTotal -= assigned;
  }

  return newRanges;
}

// ─── Hooks ──────────────────────────────────────────────────────────

export function useQada() {
  return useQuery<QadaStore | null>({
    queryKey: ["qada-progress"],
    queryFn: async () => {
      const data = await getProgress();
      return data || null;
    },
  });
}

export function useSetupQada() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  return useMutation({
    mutationFn: async (input: { missedStartDate: string; missedEndDate: string; excludeJomaa?: boolean }) => {
      const current = await getProgress();
      const start = parseISO(input.missedStartDate);
      const end = parseISO(input.missedEndDate);
      // Include both start and end days using calendar days
      const diffDays = Math.max(0, differenceInCalendarDays(end, start) + 1);
      const fridays = input.excludeJomaa ? countFridays(input.missedStartDate, input.missedEndDate) : 0;

      const newRange: QadaRange = {
        missedStartDate: input.missedStartDate,
        missedEndDate: input.missedEndDate,
        excludeJomaa: input.excludeJomaa || false,
        fajrCount: diffDays,
        dhuhrCount: diffDays - fridays,
        asrCount: diffDays,
        maghribCount: diffDays,
        ishaCount: diffDays,
        fajrCompleted: 0,
        dhuhrCompleted: 0,
        asrCompleted: 0,
        maghribCompleted: 0,
        ishaCompleted: 0,
      };

      const store: QadaStore = {
        id: 1,
        ranges: [...(current?.ranges || []), newRange],
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(store);
      return store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
      window.location.hash = '';
      toast({
        title: t.setupSuccess,
        description: t.setupSuccessDesc,
      });
    },
  });
}

export function useUpdateQadaCount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  return useMutation({
    mutationFn: async (data: { prayer: string; action: 'increment' | 'decrement' }) => {
      const current = await getProgress();
      if (!current || current.ranges.length === 0) throw new Error("No progress found");

      const agg = aggregateRanges(current.ranges);
      const field = `${data.prayer}Completed` as keyof AggregatedQada;
      const currentTotal = Number(agg[field]);
      const newTotal = data.action === 'increment' ? currentTotal + 1 : Math.max(0, currentTotal - 1);

      const updatedRanges = distributeCount(current.ranges, data.prayer, newTotal);

      const updated: QadaStore = {
        ...current,
        ranges: updatedRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["qada-progress"] });
      const previousData = queryClient.getQueryData<QadaStore>(["qada-progress"]);

      if (previousData) {
        const agg = aggregateRanges(previousData.ranges);
        const field = `${newData.prayer}Completed` as keyof AggregatedQada;
        const currentTotal = Number(agg[field]);
        const newTotal = newData.action === 'increment' ? currentTotal + 1 : Math.max(0, currentTotal - 1);

        const newRanges = distributeCount(previousData.ranges, newData.prayer, newTotal);

        queryClient.setQueryData<QadaStore>(["qada-progress"], {
          ...previousData,
          ranges: newRanges,
        });
      }

      return { previousData };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["qada-progress"], context.previousData);
      }
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
    },
  });
}

export function useSetQadaCount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  return useMutation({
    mutationFn: async (data: { prayer: string; count: number }) => {
      const current = await getProgress();
      if (!current || current.ranges.length === 0) throw new Error("No progress found");

      const updatedRanges = distributeCount(current.ranges, data.prayer, data.count);

      const updated: QadaStore = {
        ...current,
        ranges: updatedRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["qada-progress"] });
      const previousData = queryClient.getQueryData<QadaStore>(["qada-progress"]);

      if (previousData) {
        const newRanges = distributeCount(previousData.ranges, newData.prayer, newData.count);

        queryClient.setQueryData<QadaStore>(["qada-progress"], {
          ...previousData,
          ranges: newRanges,
        });
      }

      return { previousData };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["qada-progress"], context.previousData);
      }
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
    },
  });
}

export function useUpdateRange() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  return useMutation({
    mutationFn: async (data: { rangeIndex: number; missedStartDate: string; missedEndDate: string; excludeJomaa?: boolean }) => {
      const current = await getProgress();
      if (!current || !current.ranges[data.rangeIndex]) throw new Error("No progress found");

      const start = parseISO(data.missedStartDate);
      const end = parseISO(data.missedEndDate);
      const diffDays = Math.max(0, differenceInCalendarDays(end, start) + 1);
      const fridays = data.excludeJomaa ? countFridays(data.missedStartDate, data.missedEndDate) : 0;
      const dhuhrCount = diffDays - fridays;

      const oldRange = current.ranges[data.rangeIndex];
      const updatedRange: QadaRange = {
        ...oldRange,
        missedStartDate: data.missedStartDate,
        missedEndDate: data.missedEndDate,
        excludeJomaa: data.excludeJomaa || false,
        fajrCount: diffDays,
        dhuhrCount: dhuhrCount,
        asrCount: diffDays,
        maghribCount: diffDays,
        ishaCount: diffDays,
        // Caps are handled automatically by the next saveProgress if we were distributing, 
        // but here we just want to ensure validity for THIS range immediately.
        fajrCompleted: Math.min(oldRange.fajrCompleted, diffDays),
        dhuhrCompleted: Math.min(oldRange.dhuhrCompleted, dhuhrCount),
        asrCompleted: Math.min(oldRange.asrCompleted, diffDays),
        maghribCompleted: Math.min(oldRange.maghribCompleted, diffDays),
        ishaCompleted: Math.min(oldRange.ishaCompleted, diffDays),
      };

      const newRanges = [...current.ranges];
      newRanges[data.rangeIndex] = updatedRange;

      const updated: QadaStore = {
        ...current,
        ranges: newRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
      toast({ title: t.editRangeSuccess });
    },
    onError: () => {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRange() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  return useMutation({
    mutationFn: async (rangeIndex: number) => {
      const current = await getProgress();
      if (!current) throw new Error("No progress found");

      const newRanges = current.ranges.filter((_, i) => i !== rangeIndex);

      const updated: QadaStore = {
        ...current,
        ranges: newRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
      toast({
        title: t.deleteRangeSuccess,
      });
    },
    onError: () => {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: "destructive",
      });
    },
  });
}

export function useImportExport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  const exportData = async () => {
    try {
      const data = await getProgress();
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${t.exportFilename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let store: QadaStore;

      // Detect old single-range format (has missedStartDate at top level)
      if (data.missedStartDate && !data.ranges) {
        store = {
          id: 1,
          ranges: [legacyToRange(data as QadaData)],
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      } else if (data.ranges && Array.isArray(data.ranges)) {
        store = { id: 1, ranges: data.ranges, updatedAt: data.updatedAt || new Date().toISOString() };
      } else {
        throw new Error("Invalid format");
      }

      await saveProgress(store);
      queryClient.setQueryData(["qada-progress"], store);
      await queryClient.invalidateQueries({ queryKey: ["qada-progress"] });

      toast({
        title: t.importSuccess,
      });

      return true;
    } catch (err) {
      toast({
        title: t.importError,
        variant: "destructive",
      });
      return false;
    }
  };

  return { exportData, importData };
}
