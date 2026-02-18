import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, saveProgress, type QadaData } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

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

  return useMutation({
    mutationFn: async (input: { missedStartDate: string; missedEndDate: string }) => {
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
        witrCount: diffDays,
        fajrCompleted: 0,
        dhuhrCompleted: 0,
        asrCompleted: 0,
        maghribCompleted: 0,
        ishaCompleted: 0,
        witrCompleted: 0,
        updatedAt: new Date().toISOString(),
      };

      await saveProgress(newData);
      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
      window.location.hash = ''; // Return to dashboard
      toast({
        title: "Setup Complete",
        description: "Your missed prayer tracking has started.",
      });
    },
  });
}

export function useUpdateQadaCount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        title: "Update Failed",
        description: "Could not save your progress.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["qada-progress"] });
    },
  });
}
