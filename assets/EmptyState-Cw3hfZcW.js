import{o as e,b as y}from"./index-CXPzQqwt.js";import{C as b}from"./Card-BI1SViJ3.js";const w=({icon:a,title:c,description:i,actionText:o,onAction:l,align:d="center",size:n="md",showMockGraph:x=!1,className:m=""})=>{const r=d==="left",t=n==="sm",s=n==="lg",p=`
    w-full relative overflow-hidden backdrop-blur-sm transition-all duration-350
    border border-dashed border-border/80 hover:border-brand-500/30 bg-card/25 dark:bg-card/[0.015]
    ${r?"items-start text-left":"items-center text-center"}
    ${t?"rounded-xl":"rounded-2xl"}
    ${t?"p-4":s?"p-6 sm:p-10":"p-5 sm:p-6"}
    ${t?"space-y-3":s?"space-y-5":"space-y-4"}
    ${m}
  `,h=`
    flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105
    rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 text-brand-500
    ${r?"":"mx-auto"}
    ${t?"h-9 w-9 text-xs":s?"h-12 w-12 text-base":"h-10 w-10 text-sm"}
  `,f=`
    font-sans font-black tracking-tight text-foreground leading-tight
    ${t?"text-xs":s?"text-lg sm:text-xl":"text-sm sm:text-base"}
  `,u=`
    text-muted-foreground leading-relaxed font-medium
    ${r?"":"mx-auto"}
    ${t?"text-[11px] max-w-xs":s?"text-xs sm:text-sm max-w-lg":"text-xs max-w-sm"}
  `;return e.jsxs(b,{hoverEffect:!1,className:p,children:[e.jsx("div",{className:`absolute top-0 w-32 h-32 bg-brand-500/[0.03] dark:bg-brand-500/[0.05] rounded-full blur-2xl pointer-events-none select-none ${r?"right-0":"left-1/2 -translate-x-1/2"}`}),x&&e.jsx("div",{className:"absolute bottom-0 inset-x-0 h-16 pointer-events-none select-none overflow-hidden opacity-[0.035] dark:opacity-[0.06] transition-opacity duration-300",children:e.jsxs("svg",{className:"w-full h-full",viewBox:"0 0 400 100",preserveAspectRatio:"none",children:[e.jsx("line",{x1:"0",y1:"20",x2:"400",y2:"20",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("line",{x1:"0",y1:"50",x2:"400",y2:"50",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("line",{x1:"0",y1:"80",x2:"400",y2:"80",stroke:"currentColor",strokeWidth:"0.75",strokeDasharray:"3 3"}),e.jsx("path",{d:"M 0 85 Q 50 65 100 75 T 200 45 T 300 55 T 400 25",fill:"none",stroke:"var(--color-primary, currentColor)",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:"100",cy:"75",r:"2.5",fill:"var(--color-primary, currentColor)"}),e.jsx("circle",{cx:"200",cy:"45",r:"2.5",fill:"var(--color-primary, currentColor)"}),e.jsx("circle",{cx:"300",cy:"55",r:"2.5",fill:"var(--color-primary, currentColor)"})]})}),e.jsxs("div",{className:`w-full flex ${r?"flex-row items-center gap-4":"flex-col gap-3"}`,children:[a&&e.jsx("div",{className:h,children:a}),e.jsxs("div",{className:"flex-1 space-y-1",children:[e.jsx("h3",{className:f,children:c}),e.jsx("p",{className:u,children:i})]})]}),o&&l&&e.jsx("div",{className:`pt-1 flex ${r?"justify-start":"justify-center"}`,children:e.jsx(y,{onClick:l,variant:"secondary",className:"h-11 px-5 rounded-xl font-extrabold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.97]",children:o})})]})};export{w as E};
