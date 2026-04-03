// BlogAuto Pro - ImageGenerator v3.1
/**
 * BlogAuto Pro - Image Generator Page
 * ✅ 실패 이미지 전체 재시도
 * ✅ 갤러리 초기화 버튼
 * ✅ 이미지 로딩 완전 수정 (실패시 재시도 포함)
 * ✅ 배포 연동 수정
 */

import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Image, RefreshCw, Download, Grid3X3, List, Wand2,
  Check, ArrowRight, Sparkles, CheckSquare, Square, ArrowLeft,
  X, ChevronLeft, ChevronRight, ZoomIn, Trash2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getContentProvider, getImageProvider, getAPIKey, IMAGE_AI_OPTIONS } from "@/lib/ai-config";
import { useLocation } from "wouter";

// ── 이미지 URL 로드 테스트 ──────────────────────────
async function testImageUrl(url: string, timeoutMs = 12000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();

    const done = (ok: boolean) => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      img.src = "";
      resolve(ok);
    };

    const timer = window.setTimeout(() => done(false), timeoutMs);

    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = url;
  });
}
