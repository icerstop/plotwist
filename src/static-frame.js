// Keep saved motion settings intact when creating a still image.
export function staticFrameConfig(config){return {...config,outputMode:'image',visuals:{...config.visuals,design:{...config.visuals?.design,motion:{...config.visuals?.design?.motion,enabled:false}}}};}
