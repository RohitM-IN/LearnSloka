import { useState, useEffect } from 'react';
import { parseSRT, type SRTBlock, type SRTDocument } from '../utils/parser';

export interface UseSRTLoaderProps {
  srtUrl: string;
}

export const useSRTLoader = ({ srtUrl }: UseSRTLoaderProps) => {
  const [blocks, setBlocks] = useState<SRTBlock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(srtUrl)
      .then((res) => res.text())
      .then((srt) => {
        if (isMounted) {
          const doc: SRTDocument = parseSRT(srt);
          console.log(`📜 SRT loaded successfully: ${doc.blocks.length} blocks from ${srtUrl}`,doc.blocks);
          setBlocks(doc.blocks);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error('Error loading SRT:', error);
          setError(error.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [srtUrl]);

  return {
    blocks,
    isLoading,
    error
  };
};