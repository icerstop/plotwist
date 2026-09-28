import React from 'react';
import {frequencies} from './recurrence.js';
export function FrequencyPicker({label,value,onChange}){
 return <label className="frequency-field"><span>{label}</span><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{frequencies.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>;
}
