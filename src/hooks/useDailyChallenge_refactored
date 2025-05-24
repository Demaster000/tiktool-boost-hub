
import { useChallengeData } from "./challenges/useChallengeData";
import { useChallengeProgress } from "./challenges/useChallengeProgress";
import { useChallengeNavigation } from "./challenges/useChallengeNavigation";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const useDailyChallenge = () => {
  const { user } = useAuth();
  const { challenges, loading, fetchChallenges, getChallengeIcon, getChallengeByType } = useChallengeData();
  const { completeStep, updateChallengeProgress } = useChallengeProgress();
  const { redirectToTool } = useChallengeNavigation();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Cache de resultados para evitar operações repetidas
  const resultsCache = useRef(new Map<string, any>());

  // Safe execution wrapper to ensure Promise returns
  const safeExecute = (fn: Function | undefined) => {
    if (typeof fn !== 'function') return Promise.resolve();
    try {
      const result = fn();
      return result instanceof Promise ? result.catch(err => {
        console.error("Error in promise execution:", err);
        return undefined;
      }) : Promise.resolve(result || undefined);
    } catch (error: any) {
      console.error("Error executing function:", error);
      return Promise.resolve();
    }
  };

  // Provide a wrapper around updateChallengeProgress for better logging and error handling
  const updateProgress = async (challengeType: string, progress: number) => {
    // Verificar cache para operações repetidas
    const cacheKey = `update_${challengeType}_${progress}`;
    const cacheTime = resultsCache.current.get(cacheKey);
    
    // Se a mesma operação foi realizada nos últimos 2 segundos, ignorar
    if (cacheTime && Date.now() - cacheTime < 2000) {
      console.log(`Ignored duplicate progress update for ${challengeType}`);
      return null;
    }
    
    try {
      console.log(`useDailyChallenge: updating progress for ${challengeType} to ${progress}`);
      
      // Get challenge by type to ensure we have valid challenge data
      const challenge = await getChallengeByType(challengeType).catch(err => {
        console.error(`Error fetching challenge type ${challengeType}:`, err);
        return null;
      });
      
      if (!challenge) {
        console.error(`Challenge with type ${challengeType} not found`);
        toast({
          title: "Erro ao atualizar progresso",
          description: `Desafio do tipo ${challengeType} não encontrado`,
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Found challenge: ${challenge.id} (${challenge.title}) for progress update`);
      
      // Update progress
      await updateChallengeProgress(challengeType, progress).catch(err => {
        console.error(`Error updating progress for ${challengeType}:`, err);
        return { success: false };
      });
      
      // Atualizar cache para evitar operações repetidas
      resultsCache.current.set(cacheKey, Date.now());
      
      // Update refresh timestamp
      setLastRefresh(new Date());
      
      console.log(`Progress updated successfully for ${challengeType}`);
      
      // Return the challenge for chaining
      return challenge;
    } catch (error: any) {
      console.error(`Error updating progress for ${challengeType}:`, error);
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message || "Ocorreu um erro ao atualizar o progresso",
        variant: "destructive"
      });
      return null;
    }
  };

  // Modified fetchChallenges wrapper to prevent concurrent calls
  const fetchChallengesWrapper = async () => {
    console.log("Wrapper: fetchChallenges called - MANUAL TRIGGER ONLY");
    
    try {
      const result = await safeExecute(fetchChallenges);
      console.log("Wrapper: fetchChallenges result:", result || challenges);
      return result || challenges;
    } catch (error) {
      console.error("Error in fetchChallengesWrapper:", error);
      return challenges;
    }
  };

  return { 
    completeStep, 
    loading, 
    redirectToTool, 
    getChallengeIcon, 
    updateChallengeProgress: updateProgress,
    fetchChallenges: fetchChallengesWrapper,
    getChallengeByType,
    challenges,
    lastRefresh
  };
};

export default useDailyChallenge;
