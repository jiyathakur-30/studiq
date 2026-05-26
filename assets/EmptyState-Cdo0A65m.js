import{p as e,b as y}from"./index-BFYhCFjH.js";import{C as v}from"./Card-CZzJV8xx.js";const C=({icon:a,title:c,description:x,actionText:o,onAction:l,align:d="center",size:n="md",showMockGraph:m=!1,className:p="",children:i})=>{const t=d==="left",r=n==="sm",s=n==="lg",f=`
    w-full relative overflow-hidden backdrop-blur-sm transition-all duration-300
    border border-black/[0.06] dark:border-white/[0.06] bg-card/30
    shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]
    ${t?"items-start text-left":"items-center text-center"}
    ${r?"rounded-xl":"rounded-2xl"}
    ${r?"p-4":s?"p-6 sm:p-10":"p-5 sm:p-6"}
    ${r?"space-y-3":s?"space-y-5":"space-y-4"}
    ${p}
  `,u=`
    flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105
    rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 text-brand-500
    ${t?"":"mx-auto"}
    ${r?"h-9 w-9 text-xs":s?"h-12 w-12 text-base":"h-10 w-10 text-sm"}
  `,h=`
    font-sans font-black tracking-tight text-foreground leading-tight
    ${r?"text-xs":s?"text-lg sm:text-xl":"text-sm sm:text-base"}
  `,b=`
    text-muted-foreground leading-relaxed font-medium
    ${t?"":"mx-auto"}
    ${r?"text-[11px] max-w-xs":s?"text-xs sm:text-sm max-w-lg":"text-xs max-w-sm"}
  `;return e.jsxs(v,{hoverEffect:!1,className:f,children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent pointer-events-none"}),e.jsx("div",{className:`absolute top-0 w-32 h-32 bg-brand-500/[0.03] dark:bg-brand-500/[0.05] rounded-full blur-2xl pointer-events-none select-none ${t?"right-0":"left-1/2 -translate-x-1/2"}`}),m&&e.jsx("div",{className:"absolute bottom-0 inset-x-0 h-16 pointer-events-none select-none overflow-hidden opacity-[0.035] dark:opacity-[0.06] transition-opacity duration-300",children:e.jsxs("svg",{className:"w-full h-full",viewBox:"0 0 400 100",preserveAspectRatio:"none",children:[e.jsx("line",{x1:"0",y1:"20",x2:"400",y2:"20",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("line",{x1:"0",y1:"50",x2:"400",y2:"50",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("line",{x1:"0",y1:"80",x2:"400",y2:"80",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("path",{d:"M 0 85 Q 50 65 100 75 T 200 45 T 300 55 T 400 25",fill:"none",stroke:"var(--color-primary, currentColor)",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:"100",cy:"75",r:"2.5",fill:"var(--color-primary, currentColor)"}),e.jsx("circle",{cx:"200",cy:"45",r:"2.5",fill:"var(--color-primary, currentColor)"}),e.jsx("circle",{cx:"300",cy:"55",r:"2.5",fill:"var(--color-primary, currentColor)"})]})}),e.jsxs("div",{className:`w-full flex relative z-10 ${t?"flex-row items-center gap-4":"flex-col gap-3"}`,children:[a&&e.jsx("div",{className:u,children:a}),e.jsxs("div",{className:"flex-1 space-y-1",children:[e.jsx("h3",{className:h,children:c}),e.jsx("p",{className:b,children:x})]})]}),i&&e.jsx("div",{className:"w-full relative z-10 animate-fade-in",children:i}),o&&l&&e.jsx("div",{className:`pt-1 flex relative z-10 ${t?"justify-start":"justify-center"}`,children:e.jsx(y,{onClick:l,variant:"secondary",className:"h-11 px-5 rounded-xl font-extrabold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.97]",children:o})})]})};export{C as E};
