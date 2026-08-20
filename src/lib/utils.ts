import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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