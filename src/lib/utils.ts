import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
  if (el.scrollHeight > 240) {
    el.style.overflowY = "auto";
  } else {
    el.style.overflowY = "hidden";
  }
}

export async function timeStage<T>(
  stageName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const ms = Math.round(performance.now() - start)
    console.log(`[pipeline] ${stageName}: ${ms}ms`)
    return result
  } catch (error) {
    const ms = Math.round(performance.now() - start)
    console.error(`[pipeline] ${stageName} FAILED after ${ms}ms`)
    throw error
  }
}