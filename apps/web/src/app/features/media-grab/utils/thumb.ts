export const thumbSvg = (_title: string, hue: number): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stop-color="hsl(${hue}, 70%, 32%)"/>
           <stop offset="1" stop-color="hsl(${(hue + 40) % 360}, 70%, 18%)"/>
         </linearGradient>
       </defs>
       <rect width="320" height="180" fill="url(#g)"/>
       <circle cx="55" cy="135" r="60" fill="hsl(${(hue + 20) % 360}, 80%, 50%)" opacity=".35"/>
       <circle cx="270" cy="40" r="38" fill="hsl(${(hue + 90) % 360}, 80%, 55%)" opacity=".35"/>
     </svg>`,
  )}`;
