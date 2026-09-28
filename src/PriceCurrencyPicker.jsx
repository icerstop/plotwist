import React from 'react';
export default function PriceCurrencyPicker({value,onChange}){
 return <label className="field"><span className="field-label">Waluta cen</span><select aria-label="Waluta cen" value={value} onChange={e=>onChange(e.target.value)}><option value="native">Oryginalna waluta notowania</option><option value="USD">USD · dolar amerykański</option><option value="PLN">PLN · złoty polski</option></select><small>Spółki notowane w USD zachowują oryginalne ceny i pełną historię. Inne waluty przeliczamy według historycznego kursu NBP.</small></label>;
}
