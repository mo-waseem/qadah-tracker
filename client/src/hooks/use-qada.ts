import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, saveProgress, type QadaStore, type QadaRange, type QadaData, legacyToRange } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

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
    mutationFn: async (input: { missedStartDate: string; missedEndDate: string }) => {
      const current = await getProgress();
      const start = new Date(input.missedStartDate);
      const end = new Date(input.missedEndDate);
      const diffDays = Math.max(0, differenceInDays(end, start));

      const newRange: QadaRange = {
        missedStartDate: input.missedStartDate,
        missedEndDate: input.missedEndDate,
        fajrCount: diffDays,
        dhuhrCount: diffDays,
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
    mutationFn: async (data: { prayer: string; action: 'increment' | 'decrement'; rangeIndex: number }) => {
      const current = await getProgress();
      if (!current || !current.ranges[data.rangeIndex]) throw new Error("No progress found");

      const range = { ...current.ranges[data.rangeIndex] };
      const completedField = `${data.prayer}Completed` as keyof QadaRange;
      const currentCount = Number(range[completedField]);
      const newCount = data.action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);

      (range as any)[completedField] = newCount;

      const newRanges = [...current.ranges];
      newRanges[data.rangeIndex] = range;

      const updated: QadaStore = {
        ...current,
        ranges: newRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["qada-progress"] });
      const previousData = queryClient.getQueryData<QadaStore>(["qada-progress"]);

      if (previousData && previousData.ranges[newData.rangeIndex]) {
        const range = { ...previousData.ranges[newData.rangeIndex] };
        const completedField = `${newData.prayer}Completed` as keyof QadaRange;
        const currentCount = Number(range[completedField]);
        const newCount = newData.action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);
        (range as any)[completedField] = newCount;

        const newRanges = [...previousData.ranges];
        newRanges[newData.rangeIndex] = range;

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
    mutationFn: async (data: { prayer: string; count: number; rangeIndex: number }) => {
      const current = await getProgress();
      if (!current || !current.ranges[data.rangeIndex]) throw new Error("No progress found");

      const range = { ...current.ranges[data.rangeIndex] };
      const completedField = `${data.prayer}Completed` as keyof QadaRange;
      const totalField = `${data.prayer}Count` as keyof QadaRange;
      const total = Number(range[totalField]);
      const clamped = Math.max(0, Math.min(data.count, total));

      (range as any)[completedField] = clamped;

      const newRanges = [...current.ranges];
      newRanges[data.rangeIndex] = range;

      const updated: QadaStore = {
        ...current,
        ranges: newRanges,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["qada-progress"] });
      const previousData = queryClient.getQueryData<QadaStore>(["qada-progress"]);

      if (previousData && previousData.ranges[newData.rangeIndex]) {
        const range = { ...previousData.ranges[newData.rangeIndex] };
        const completedField = `${newData.prayer}Completed` as keyof QadaRange;
        const totalField = `${newData.prayer}Count` as keyof QadaRange;
        const total = Number(range[totalField]);
        const clamped = Math.max(0, Math.min(newData.count, total));
        (range as any)[completedField] = clamped;

        const newRanges = [...previousData.ranges];
        newRanges[newData.rangeIndex] = range;

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
    mutationFn: async (data: { rangeIndex: number; missedStartDate: string; missedEndDate: string }) => {
      const current = await getProgress();
      if (!current || !current.ranges[data.rangeIndex]) throw new Error("No progress found");

      const start = new Date(data.missedStartDate);
      const end = new Date(data.missedEndDate);
      const diffDays = Math.max(0, differenceInDays(end, start));

      const oldRange = current.ranges[data.rangeIndex];
      const updatedRange: QadaRange = {
        ...oldRange,
        missedStartDate: data.missedStartDate,
        missedEndDate: data.missedEndDate,
        fajrCount: diffDays,
        dhuhrCount: diffDays,
        asrCount: diffDays,
        maghribCount: diffDays,
        ishaCount: diffDays,
        // Cap completed at new total
        fajrCompleted: Math.min(oldRange.fajrCompleted, diffDays),
        dhuhrCompleted: Math.min(oldRange.dhuhrCompleted, diffDays),
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
