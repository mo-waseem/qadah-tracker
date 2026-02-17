import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type QadaSetupInput, type QadaUpdateInput, type QadaResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useQada() {
  return useQuery<QadaResponse | null>({
    queryKey: [api.qada.get.path],
    queryFn: async () => {
      const res = await fetch(api.qada.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch qada data");
      return await res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSetupQada() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: QadaSetupInput) => {
      const res = await fetch(api.qada.setup.path, {
        method: api.qada.setup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to setup tracking");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.qada.get.path] });
      toast({
        title: "Setup Complete",
        description: "Your missed prayer tracking has started.",
      });
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateQadaCount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: QadaUpdateInput) => {
      const res = await fetch(api.qada.updateCounts.path, {
        method: api.qada.updateCounts.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update count");
      }
      return await res.json();
    },
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [api.qada.get.path] });
      const previousData = queryClient.getQueryData<QadaResponse>([api.qada.get.path]);

      if (previousData) {
        const fieldName = `${newData.prayer}Completed` as keyof QadaResponse;
        const currentCount = Number(previousData[fieldName]);
        const newCount = newData.action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);

        queryClient.setQueryData<QadaResponse>([api.qada.get.path], {
          ...previousData,
          [fieldName]: newCount,
        });
      }

      return { previousData };
    },
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([api.qada.get.path], context.previousData);
      }
      toast({
        title: "Update Failed",
        description: "Could not save your progress.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [api.qada.get.path] });
    },
  });
}
