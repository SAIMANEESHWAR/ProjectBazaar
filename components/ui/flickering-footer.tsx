import { ClassValue, clsx } from "clsx";
import { CTAArrowIcon } from "../CTAArrowIcon";
import * as Color from "color-bits";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRGBA = (
  cssColor: React.CSSProperties["color"],
  fallback: string = "rgba(180, 180, 180)",
): string => {
  if (typeof window === "undefined") return fallback;
  if (!cssColor) return fallback;
  try {
    if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
      const element = document.createElement("div");
      element.style.color = cssColor;
      document.body.appendChild(element);
      const computedColor = window.getComputedStyle(element).color;
      document.body.removeChild(element);
      return Color.formatRGBA(Color.parse(computedColor));
    }
    return Color.formatRGBA(Color.parse(cssColor));
  } catch (e) {
    console.error("Color parsing failed:", e);
    return fallback;
  }
};

export const colorWithOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith("rgb")) return color;
  return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

export const Icons = {
  logo: ({ className }: { className?: string }) => (
    <svg
      width="42"
      height="24"
      viewBox="0 0 42 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4 fill-[var(--secondary)]", className)}
    >
      <g clipPath="url(#clip0_322_9172)">
        <path
          d="M22.3546 0.96832C22.9097 0.390834 23.6636 0.0664062 24.4487 0.0664062C27.9806 0.066408 31.3091 0.066408 34.587 0.0664146C41.1797 0.0664284 44.481 8.35854 39.8193 13.2082L29.6649 23.7718C29.1987 24.2568 28.4016 23.9133 28.4016 23.2274V13.9234L29.5751 12.7025C30.5075 11.7326 29.8472 10.0742 28.5286 10.0742H13.6016L22.3546 0.96832Z"
          fill="currentColor"
        />
        <path
          d="M19.6469 23.0305C19.0919 23.608 18.338 23.9324 17.5529 23.9324C14.021 23.9324 10.6925 23.9324 7.41462 23.9324C0.821896 23.9324 -2.47942 15.6403 2.18232 10.7906L12.3367 0.227022C12.8029 -0.257945 13.6 0.0855283 13.6 0.771372L13.6 10.0754L12.4265 11.2963C11.4941 12.2662 12.1544 13.9246 13.473 13.9246L28.4001 13.9246L19.6469 23.0305Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_322_9172">
          <rect width="42" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  soc2: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-4", className)}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_linear_1_4900)" />
      <path d="M15.0475 29.6233C13.7506 29.6233 12.9548 28.8938 12.8738 27.8033L13.8464 27.7443C13.9348 28.4222 14.3401 28.798 15.0622 28.798C15.6812 28.798 16.0348 28.5696 16.0348 28.1201C16.0348 27.7148 15.8285 27.4717 14.7601 27.2212C13.4633 26.9264 12.977 26.558 12.977 25.7033C12.977 24.7896 13.6917 24.1559 14.8633 24.1559C16.1159 24.1559 16.8012 24.8854 16.9191 25.8948L15.9538 25.9391C15.8875 25.3717 15.5117 24.9812 14.8485 24.9812C14.2959 24.9812 13.957 25.2612 13.957 25.6664C13.957 26.0938 14.2001 26.2559 15.1359 26.4696C16.5433 26.7717 17.0148 27.2875 17.0148 28.0685C17.0148 29.0264 16.2338 29.6233 15.0475 29.6233ZM19.9915 29.6233C18.4367 29.6233 17.5009 28.5843 17.5009 26.897C17.5009 25.2096 18.4367 24.1559 19.9915 24.1559C21.5536 24.1559 22.4894 25.2096 22.4894 26.897C22.4894 28.5843 21.5536 29.6233 19.9915 29.6233Z" fill="#101828" />
      <defs>
        <linearGradient id="paint0_linear_1_4900" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9FAFB" /><stop offset="1" stopColor="#E5E7EB" />
        </linearGradient>
      </defs>
    </svg>
  ),
  soc2Dark: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-4", className)}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_linear_1_2018)" />
      <path d="M15.0441 29.6233C14.6118 29.6233 14.2385 29.5496 13.9241 29.4022C13.6097 29.2499 13.3617 29.0362 13.1799 28.7612C12.9982 28.4861 12.8925 28.1668 12.8631 27.8033L13.8357 27.7443C13.8701 27.9752 13.9364 28.1692 14.0346 28.3264C14.1329 28.4787 14.2655 28.5966 14.4325 28.6801C14.6045 28.7587 14.8132 28.798 15.0589 28.798C15.3683 28.798 15.6066 28.7415 15.7736 28.6285C15.9455 28.5106 16.0315 28.3412 16.0315 28.1201Z" fill="#F4F4F5" />
      <defs>
        <linearGradient id="paint0_linear_1_2018" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272A" /><stop offset="1" stopColor="#52525C" />
        </linearGradient>
      </defs>
    </svg>
  ),
  hipaa: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_linear_hipaa)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M19.0736 7.30078H18.5513C17.4523 7.40753 16.5515 7.91698 15.6382 8.43349L15.6382 8.4335C15.3095 8.61938 14.9792 8.80617 14.6375 8.97544C13.1797 9.69771 11.6905 10.3538 10.1701 10.9436C9.31299 11.2764 8.4347 11.5409 7.5352 11.7372C7.4488 11.7559 7.36935 11.7893 7.29688 11.8372V11.8727C7.5102 11.9479 7.76245 11.9888 8.05363 11.9953C8.84267 12.0125 9.51349 12.0095 10.0661 11.9865C10.1506 11.9828 10.2321 11.9633 10.3106 11.928C12.4837 10.9519 14.6612 9.98527 16.8432 9.02797C16.8476 9.02613 16.852 9.02536 16.8565 9.02567C16.8777 9.02843 16.879 9.03427 16.8603 9.04318C14.6862 10.108 12.5139 11.176 10.3434 12.2473C10.2138 12.3114 9.41474 12.7999 9.89472 12.9132C10.6648 13.0953 11.6052 13.0639 12.3886 12.9939C12.4952 12.9843 12.6 12.9582 12.7029 12.9155C14.1157 12.3278 15.0315 11.9343 15.4503 11.7349C15.5082 11.7069 15.5663 11.6793 15.6245 11.6519C16.9222 11.0378 16.9367 11.0651 15.6682 11.734C14.7886 12.1972 13.894 12.6323 12.9844 13.039C12.7769 13.1321 11.6328 13.7584 12.3364 13.9538C12.4725 13.9916 12.6016 14.0121 12.7238 14.0155C13.3976 14.0333 14.0708 13.9567 14.7434 13.7856C14.8605 13.7558 14.9747 13.7083 15.0861 13.6432C15.7916 13.2327 16.4885 12.8092 17.1769 12.3727C17.1826 12.3694 17.2268 12.3621 17.1921 12.3879C16.5905 12.8389 15.9774 13.2745 15.3529 13.6948C15.2118 13.7897 15.1129 13.8702 15.0562 13.9363C14.891 14.1289 14.5539 14.61 15.0282 14.733C15.5751 14.8745 16.5412 14.457 17.0397 14.2275C17.4891 14.0207 17.9114 13.6074 18.2623 13.264L18.2623 13.264L18.2817 13.245C18.3135 13.2141 18.3187 13.2542 18.3011 13.2736C18.0812 13.5218 17.8525 13.7621 17.6151 13.9943C17.442 14.1642 17.3197 14.3066 17.2481 14.4215C16.2811 15.9736 18.2741 15.2192 18.7317 14.9459C19.0251 14.7708 19.3157 14.3372 19.4771 14.0773C19.4847 14.065 19.4923 14.055 19.4999 14.0473C19.5306 14.016 19.5374 14.0203 19.5203 14.0602C19.395 14.3536 19.2423 14.6318 19.0622 14.8948C18.8756 15.1671 18.9696 15.539 19.3333 15.6045C19.9746 15.7197 20.5823 15.1432 20.8306 14.6275C20.8349 14.6186 20.8427 14.6117 20.8525 14.6082C20.917 14.5857 20.7513 14.9203 20.694 15.036L20.694 15.036C20.6842 15.0557 20.6777 15.069 20.6759 15.0731C20.6145 15.2129 20.5891 15.3212 20.5999 15.398C20.6298 15.6155 20.8211 15.675 21.0262 15.6307C21.5992 15.5072 22.0821 15.0501 22.375 14.569C22.3793 14.5618 22.3816 14.5535 22.3816 14.545C22.3658 13.4218 22.3524 12.6862 22.3413 12.3381C22.3296 11.975 22.3313 11.6482 22.3465 11.3579C22.0265 11.3502 21.7496 11.3301 21.5157 11.2976C21.0295 11.2303 20.8074 10.6556 20.7551 10.2381C20.7421 10.1328 20.7309 10.0254 20.7197 9.91727C20.6412 9.1606 20.5585 8.36393 19.7843 7.94825C18.9876 7.52014 17.6982 7.77544 16.9177 8.14733C16.6867 8.25724 16.4617 8.36722 16.2377 8.47668C15.6119 8.78252 14.9945 9.08425 14.2795 9.36898C14.2774 9.3698 14.2738 9.37189 14.2694 9.37443C14.2515 9.3848 14.2205 9.40273 14.2216 9.37313C14.2217 9.36881 14.2231 9.3646 14.2257 9.36094C14.2282 9.35728 14.2317 9.35432 14.2358 9.35239C15.1708 8.93273 16.0943 8.49064 17.0065 8.02613C17.1644 7.94594 17.3811 7.86514 17.6564 7.78373C18.1853 7.62751 18.7113 7.58097 19.2407 7.65332C20.2115 7.7865 20.6664 8.52659 20.7936 9.39571C20.8053 9.47557 20.8144 9.57357 20.8245 9.68219C20.8751 10.2286 20.9506 11.044 21.5138 11.1708C21.7195 11.2172 21.9931 11.24 22.3346 11.239L22.319 10.9648C22.3183 10.9535 22.3134 10.9428 22.3051 10.9348C22.2969 10.9268 22.2859 10.9221 22.2743 10.9215C22.0977 10.9123 21.9254 10.8988 21.7573 10.881C21.118 10.8134 21.057 9.96774 21.0224 9.48751L21.0186 9.43534C20.9317 8.26069 20.3701 7.38696 19.0736 7.30078Z" fill="url(#paint1_linear_hipaa)" />
      <defs>
        <linearGradient id="paint0_linear_hipaa" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5E7EB" /><stop offset="1" stopColor="#F9FAFB" />
        </linearGradient>
        <linearGradient id="paint1_linear_hipaa" x1="30.5498" y1="10.0698" x2="20.9753" y2="31.2119" gradientUnits="userSpaceOnUse">
          <stop offset="0.473541" stopColor="#364153" stopOpacity="0.7" /><stop offset="0.811446" stopColor="#364153" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  ),
  hipaaDark: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_linear_hipaa_dark)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M19.0736 7.30078H18.5513C17.4523 7.40753 16.5515 7.91698 15.6382 8.43349L15.6382 8.4335C15.3095 8.61938 14.9792 8.80617 14.6375 8.97544C13.1797 9.69771 11.6905 10.3538 10.1701 10.9436C9.31299 11.2764 8.4347 11.5409 7.5352 11.7372C7.4488 11.7559 7.36935 11.7893 7.29688 11.8372V11.8727C7.5102 11.9479 7.76245 11.9888 8.05363 11.9953C8.84267 12.0125 9.51349 12.0095 10.0661 11.9865C10.1506 11.9828 10.2321 11.9633 10.3106 11.928C12.4837 10.9519 14.6612 9.98527 16.8432 9.02797C16.8476 9.02613 16.852 9.02536 16.8565 9.02567C16.8777 9.02843 16.879 9.03427 16.8603 9.04318C14.6862 10.108 12.5139 11.176 10.3434 12.2473C10.2138 12.3114 9.41474 12.7999 9.89472 12.9132C10.6648 13.0953 11.6052 13.0639 12.3886 12.9939C12.4952 12.9843 12.6 12.9582 12.7029 12.9155C14.1157 12.3278 15.0315 11.9343 15.4503 11.7349C15.5082 11.7069 15.5663 11.6793 15.6245 11.6519C16.9222 11.0378 16.9367 11.0651 15.6682 11.734C14.7886 12.1972 13.894 12.6323 12.9844 13.039C12.7769 13.1321 11.6328 13.7584 12.3364 13.9538C12.4725 13.9916 12.6016 14.0121 12.7238 14.0155C13.3976 14.0333 14.0708 13.9567 14.7434 13.7856C14.8605 13.7558 14.9747 13.7083 15.0861 13.6432C15.7916 13.2327 16.4885 12.8092 17.1769 12.3727C17.1826 12.3694 17.2268 12.3621 17.1921 12.3879C16.5905 12.8389 15.9774 13.2745 15.3529 13.6948C15.2118 13.7897 15.1129 13.8702 15.0562 13.9363C14.891 14.1289 14.5539 14.61 15.0282 14.733C15.5751 14.8745 16.5412 14.457 17.0397 14.2275C17.4891 14.0207 17.9114 13.6074 18.2623 13.264L18.2623 13.264L18.2817 13.245C18.3135 13.2141 18.3187 13.2542 18.3011 13.2736C18.0812 13.5218 17.8525 13.7621 17.6151 13.9943C17.442 14.1642 17.3197 14.3066 17.2481 14.4215C16.2811 15.9736 18.2741 15.2192 18.7317 14.9459C19.0251 14.7708 19.3157 14.3372 19.4771 14.0773C19.4847 14.065 19.4923 14.055 19.4999 14.0473C19.5306 14.016 19.5374 14.0203 19.5203 14.0602C19.395 14.3536 19.2423 14.6318 19.0622 14.8948C18.8756 15.1671 18.9696 15.539 19.3333 15.6045C19.9746 15.7197 20.5823 15.1432 20.8306 14.6275C20.8349 14.6186 20.8427 14.6117 20.8525 14.6082C20.917 14.5857 20.7513 14.9203 20.694 15.036L20.694 15.036C20.6842 15.0557 20.6777 15.069 20.6759 15.0731C20.6145 15.2129 20.5891 15.3212 20.5999 15.398C20.6298 15.6155 20.8211 15.675 21.0262 15.6307C21.5992 15.5072 22.0821 15.0501 22.375 14.569C22.3793 14.5618 22.3816 14.5535 22.3816 14.545C22.3658 13.4218 22.3524 12.6862 22.3413 12.3381C22.3296 11.975 22.3313 11.6482 22.3465 11.3579C22.0265 11.3502 21.7496 11.3301 21.5157 11.2976C21.0295 11.2303 20.8074 10.6556 20.7551 10.2381C20.7421 10.1328 20.7309 10.0254 20.7197 9.91727C20.6412 9.1606 20.5585 8.36393 19.7843 7.94825C18.9876 7.52014 17.6982 7.77544 16.9177 8.14733C16.6867 8.25724 16.4617 8.36722 16.2377 8.47668C15.6119 8.78252 14.9945 9.08425 14.2795 9.36898C14.2774 9.3698 14.2738 9.37189 14.2694 9.37443C14.2515 9.3848 14.2205 9.40273 14.2216 9.37313C14.2217 9.36881 14.2231 9.3646 14.2257 9.36094C14.2282 9.35728 14.2317 9.35432 14.2358 9.35239C15.1708 8.93273 16.0943 8.49064 17.0065 8.02613C17.1644 7.94594 17.3811 7.86514 17.6564 7.78373C18.1853 7.62751 18.7113 7.58097 19.2407 7.65332C20.2115 7.7865 20.6664 8.52659 20.7936 9.39571C20.8053 9.47557 20.8144 9.57357 20.8245 9.68219C20.8751 10.2286 20.9506 11.044 21.5138 11.1708C21.7195 11.2172 21.9931 11.24 22.3346 11.239L22.319 10.9648C22.3183 10.9535 22.3134 10.9428 22.3051 10.9348C22.2969 10.9268 22.2859 10.9221 22.2743 10.9215C22.0977 10.9123 21.9254 10.8988 21.7573 10.881C21.118 10.8134 21.057 9.96774 21.0224 9.48751L21.0186 9.43534C20.9317 8.26069 20.3701 7.38696 19.0736 7.30078Z" fill="url(#paint1_linear_hipaa_dark)" />
      <defs>
        <linearGradient id="paint0_linear_hipaa_dark" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272A" /><stop offset="1" stopColor="#52525C" />
        </linearGradient>
        <linearGradient id="paint1_linear_hipaa_dark" x1="30.5498" y1="10.0698" x2="20.9753" y2="31.2119" gradientUnits="userSpaceOnUse">
          <stop offset="0.473541" stopColor="#FAFAFA" stopOpacity="0.7" /><stop offset="0.811446" stopColor="#FAFAFA" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  ),
  gdpr: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-4", className)}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_gdpr)" />
      <path d="M30.6146 31.3062L31.2991 33.4127L33.5139 33.4127L31.7221 34.7145L32.4065 36.821L30.6146 35.5191L28.8228 36.821L29.5072 34.7145L27.7153 33.4127L29.9302 33.4127L30.6146 31.3062Z" fill="url(#paint1_gdpr)" />
      <defs>
        <linearGradient id="paint0_gdpr" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5E7EB" /><stop offset="1" stopColor="#F9FAFB" />
        </linearGradient>
        <linearGradient id="paint1_gdpr" x1="15.8864" y1="51.1315" x2="29.5116" y2="5.36433" gradientUnits="userSpaceOnUse">
          <stop offset="0.188554" stopColor="#364153" stopOpacity="0" /><stop offset="0.526459" stopColor="#364153" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  ),
  gdprDark: ({ className }: { className?: string }) => (
    <svg width="46" height="45" viewBox="0 0 46 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-4", className)}>
      <rect x="3" y="0.863281" width="40" height="40" rx="20" fill="url(#paint0_gdpr_dark)" />
      <path d="M30.6146 31.3062L31.2991 33.4127L33.5139 33.4127L31.7221 34.7145L32.4065 36.821L30.6146 35.5191L28.8228 36.821L29.5072 34.7145L27.7153 33.4127L29.9302 33.4127L30.6146 31.3062Z" fill="url(#paint1_gdpr_dark)" />
      <defs>
        <linearGradient id="paint0_gdpr_dark" x1="9.88803" y1="6.55415" x2="36.0447" y2="35.5773" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272A" /><stop offset="1" stopColor="#52525C" />
        </linearGradient>
        <linearGradient id="paint1_gdpr_dark" x1="15.8864" y1="51.1315" x2="29.5116" y2="5.36433" gradientUnits="userSpaceOnUse">
          <stop offset="0.188554" stopColor="#FAFAFA" stopOpacity="0" /><stop offset="0.526459" stopColor="#FAFAFA" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  ),
};

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = "#B4B4B4",
  width,
  height,
  className,
  maxOpacity = 0.15,
  text = "",
  fontSize = 140,
  fontWeight = 600,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const memoizedColor = useMemo(() => getRGBA(color), [color]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `${fontWeight} ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr));
        maskCtx.restore();
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const squareWidth = squareSize * dpr;
          const squareHeight = squareSize * dpr;
          const maskData = maskCtx.getImageData(x, y, squareWidth, squareHeight).data;
          const hasText = maskData.some((value, index) => index % 4 === 0 && value > 0);
          const opacity = squares[i * rows + j];
          const finalOpacity = hasText ? Math.min(1, opacity * 3 + 0.4) : opacity;
          ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
          ctx.fillRect(x, y, squareWidth, squareHeight);
        }
      }
    },
    [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight],
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const cols = Math.ceil(width / (squareSize + gridGap));
      const rows = Math.ceil(height / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const newWidth = width ?? container.clientWidth;
      const newHeight = height ?? container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    };

    updateCanvasSize();
    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(gridParams.squares, deltaTime);
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0 });
    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
};

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);
  useEffect(() => {
    function checkQuery() {
      setValue(window.matchMedia(query).matches);
    }
    checkQuery();
    window.addEventListener("resize", checkQuery);
    const mq = window.matchMedia(query);
    mq.addEventListener("change", checkQuery);
    return () => {
      window.removeEventListener("resize", checkQuery);
      mq.removeEventListener("change", checkQuery);
    };
  }, [query]);
  return value;
}

export const siteConfig = {
  hero: {
    badge: "Discover projects & freelancers",
    title: "Meet your AI Agent Streamline your workflow",
    description: "The ultimate marketplace for projects, ideas, and collaborations. Discover, build, and earn.",
    cta: {
      primary: { text: "Try for Free", href: "#" },
      secondary: { text: "Log in", href: "#" },
    },
  },
  footerLinks: [
    {
      title: "Company",
      links: [
        { id: 1, title: "About", url: "#" },
        { id: 2, title: "Contact", url: "#" },
        { id: 3, title: "Blog", url: "#" },
        { id: 4, title: "Story", url: "#" },
      ],
    },
    {
      title: "Products",
      links: [
        { id: 5, title: "Curriculum", url: "#curriculum" },
        { id: 6, title: "Reviews", url: "#reviews" },
        { id: 7, title: "Pricing", url: "#pricing" },
        { id: 8, title: "Why us", url: "#why-choose-us" },
      ],
    },
    {
      title: "Resources",
      links: [
        { id: 9, title: "FAQs", url: "#" },
        { id: 10, title: "Careers", url: "#" },
        { id: 11, title: "Newsletters", url: "#" },
        { id: 12, title: "More", url: "#" },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;

function scrollToId(id: string) {
  if (!id || id === "#") return;
  const el = document.getElementById(id.replace("#", ""));
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export const FlickeringFooter: React.FC = () => {
  const tablet = useMediaQuery("(max-width: 1024px)");

  return (
    <footer id="footer" className="w-full pb-0 bg-[#0a0a0a]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <a href="#" className="flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); scrollToId(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Icons.logo className="size-8 [&_path]:fill-[#ff7a00]" />
            <p className="text-xl font-semibold text-white group-hover:text-[#ff7a00] transition-colors">ProjectBazaar</p>
          </a>
          <p className="tracking-tight text-white/70 font-medium">
            {siteConfig.hero.description}
          </p>
        </div>
        <div className="pt-5 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-center md:justify-between gap-y-5 lg:pl-10">
            {siteConfig.footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-semibold text-[#ff7a00]">{column.title}</li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug text-white/80 hover:text-white transition-colors"
                  >
                    <a
                      href={link.url}
                      onClick={(e) => {
                        if (link.url.startsWith("#")) {
                          e.preventDefault();
                          scrollToId(link.url);
                        }
                      }}
                      className="hover:text-[#ff7a00] transition-colors"
                    >
                      {link.title}
                    </a>
                    <div className="flex size-4 items-center justify-center border border-white/30 rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100 group-hover:border-[#ff7a00]">
                      <CTAArrowIcon className="h-4 w-4 object-contain" />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-24 z-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-transparent from-[40%] to-[#0a0a0a]" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text={tablet ? "Footer" : "Discover. Build. Earn."}
            fontSize={tablet ? 70 : 90}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#ff7a00"
            maxOpacity={0.25}
            flickerChance={0.1}
          />
        </div>
      </div>
    </footer>
  );
};

export default FlickeringFooter;
