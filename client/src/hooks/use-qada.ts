import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, saveProgress, type QadaData } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

export function useQada() {
  return useQuery<QadaData | null>({
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

      const newData: QadaData = {
        id: 1,
        missedStartDate: input.missedStartDate,
        missedEndDate: input.missedEndDate,
        fajrCount: diffDays,
        dhuhrCount: diffDays,
        asrCount: diffDays,
        maghribCount: diffDays,
        ishaCount: diffDays,
        fajrCompleted: current?.fajrCompleted || 0,
        dhuhrCompleted: current?.dhuhrCompleted || 0,
        asrCompleted: current?.asrCompleted || 0,
        maghribCompleted: current?.maghribCompleted || 0,
        ishaCompleted: current?.ishaCompleted || 0,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(newData);
      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
      window.location.hash = ''; // Return to dashboard
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
      if (!current) throw new Error("No progress found");

      const fieldName = `${data.prayer}Completed` as keyof QadaData;
      const currentCount = Number(current[fieldName]);
      const newCount = data.action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);

      const updated = {
        ...current,
        [fieldName]: newCount,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(updated);
      return updated;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["qada-progress"] });
      const previousData = queryClient.getQueryData<QadaData>(["qada-progress"]);

      if (previousData) {
        const fieldName = `${newData.prayer}Completed` as keyof QadaData;
        const currentCount = Number(previousData[fieldName]);
        const newCount = newData.action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);

        queryClient.setQueryData<QadaData>(["qada-progress"], {
          ...previousData,
          [fieldName]: newCount,
        });
      }

      return { previousData };
    },
    onError: (err, newData, context) => {
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

      // Basic validation
      if (!data.missedStartDate || !data.missedEndDate || typeof data.fajrCount !== 'number') {
        throw new Error("Invalid format");
      }

      await saveProgress(data);
      queryClient.setQueryData(["qada-progress"], data);
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
