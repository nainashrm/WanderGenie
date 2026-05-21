'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

export default function ExportButton({ result, formData }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { itinerary = [], packing_list = {}, weather = {}, budgetBreakdown = null } = result
      const { destination, duration, budget, travelMonth, travelStyle, interests = [] } = formData

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>WanderGenie — ${destination} Trip Plan</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#fafaf8; color:#1a2e1a; }

  /* ── Cover ── */
  .cover {
    background: linear-gradient(135deg, #0f2010 0%, #1a3a20 40%, #2d5a35 100%);
    color: white;
    padding: 60px 48px 48px;
    min-height: 220px;
    position: relative;
  }
  .cover-label { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#a8d5b5; margin-bottom:12px; }
  .cover-title { font-size:64px; font-weight:900; letter-spacing:2px; line-height:1; margin-bottom:8px; }
  .cover-sub   { font-size:15px; color:rgba(255,255,255,0.55); margin-bottom:24px; }
  .cover-tags  { display:flex; flex-wrap:wrap; gap:8px; }
  .cover-tag   { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
                 border-radius:20px; padding:4px 14px; font-size:11px; color:#a8d5b5; text-transform:capitalize; }
  .powered     { position:absolute; top:24px; right:48px; font-size:10px; color:#a8d5b5;
                 letter-spacing:3px; text-transform:uppercase; }

  /* ── Meta bar ── */
  .meta-bar { background:white; padding:20px 48px; display:flex; gap:40px; align-items:center;
              border-bottom:1px solid #e8e4df; flex-wrap:wrap; }
  .meta-item label { font-size:9px; color:#999; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:2px; }
  .meta-item span  { font-size:14px; font-weight:700; color:#1a2e1a; }

  /* ── Section headers ── */
  .section { padding:36px 48px; }
  .section + .section { border-top: 1px solid #e8e4df; }
  .section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase;
                   color:#4a7c59; font-weight:600; margin-bottom:20px; }

  /* ── Day cards ── */
  .day-card    { margin-bottom:28px; border:1px solid #e8e4df; border-radius:12px; overflow:hidden; }
  .day-header  { background:#1a2e1a; color:white; padding:14px 20px; display:flex; align-items:center; gap:14px; }
  .day-num     { width:36px; height:36px; border-radius:8px; background:#4a7c59;
                 display:flex; align-items:center; justify-content:center;
                 font-size:16px; font-weight:900; flex-shrink:0; }
  .day-info small { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#a8d5b5; display:block; }
  .day-info h3    { font-size:14px; font-weight:700; margin-top:2px; }
  .day-info p     { font-size:11px; color:rgba(255,255,255,0.5); margin-top:2px; }
  .day-body    { padding:20px; background:white; }

  /* Activities */
  .act-label   { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#4a7c59;
                 font-weight:600; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .activity    { display:flex; align-items:flex-start; gap:10px; padding:10px 12px;
                 background:#f4f1ec; border-radius:8px; margin-bottom:6px; }
  .act-dot     { width:6px; height:6px; border-radius:50%; background:#4a7c59; flex-shrink:0; margin-top:6px; }
  .act-text    { font-size:13px; color:#333; line-height:1.5; }

  /* Meals */
  .meals-grid  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:14px; }
  .meal-card   { border:1px solid #e8e4df; border-radius:8px; padding:12px; text-align:center; }
  .meal-type   { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#999; margin:6px 0 4px; display:block; }
  .meal-place  { font-size:12px; font-weight:700; color:#1a2e1a; }
  .meal-dish   { font-size:11px; color:#666; margin-top:2px; }
  .meal-cost   { font-size:10px; color:#4a7c59; font-weight:600; margin-top:3px; }

  /* Tip */
  .tip { background:#fffbeb; border:1px solid #fde68a; border-radius:8px;
         padding:10px 14px; margin-top:14px; font-size:12px; color:#555; line-height:1.5; }
  .tip strong { color:#d97706; }

  /* ── Weather ── */
  .weather-card { background:white; border:1px solid #e8e4df; border-radius:12px; padding:24px; }
  .weather-title { font-size:20px; font-weight:800; color:#1a2e1a; margin-bottom:16px; }
  .weather-grid  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:14px; }
  .weather-stat  { border:1px solid #e8e4df; border-radius:8px; padding:12px; text-align:center; }
  .weather-stat label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#999; display:block; margin-bottom:6px; }
  .weather-stat span  { font-size:18px; font-weight:800; color:#1a2e1a; }
  .weather-tip   { font-size:12px; color:#555; line-height:1.5; }

  /* ── Budget ── */
  .budget-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .budget-row  { display:flex; justify-content:space-between; align-items:center;
                 padding:10px 14px; background:white; border:1px solid #e8e4df; border-radius:8px; }
  .budget-row label { font-size:12px; color:#555; text-transform:capitalize; }
  .budget-row span  { font-size:13px; font-weight:700; color:#1a2e1a; }
  .budget-total { background:#1a2e1a; color:white; border-radius:10px; padding:14px 20px;
                  display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
  .budget-total label { font-size:12px; color:#a8d5b5; }
  .budget-total span  { font-size:18px; font-weight:900; }

  /* ── Packing ── */
  .packing-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .pack-section h4 { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#4a7c59;
                     font-weight:700; margin-bottom:10px; }
  .pack-item   { display:flex; align-items:center; gap:8px; padding:6px 0;
                 border-bottom:1px solid #f0ede8; font-size:12px; color:#444; }
  .pack-check  { width:14px; height:14px; border:2px solid #4a7c59; border-radius:3px; flex-shrink:0; }

  /* ── Footer ── */
  .footer { background:#1a2e1a; color:rgba(255,255,255,0.4); text-align:center;
            padding:20px; font-size:11px; letter-spacing:2px; text-transform:uppercase; }

  @media print {
    body { background: white; }
    .day-card { break-inside: avoid; }
    .section  { break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <div class="powered">● AI Powered by WanderGenie</div>
  <div class="cover-label">Your AI-generated trip plan</div>
  <div class="cover-title">${destination.toUpperCase()}</div>
  <div class="cover-sub">${duration}-day itinerary · AI-crafted just for you${travelMonth ? ` · ${travelMonth}` : ''}</div>
  <div class="cover-tags">
    ${interests.map(i => `<span class="cover-tag">${i}</span>`).join('')}
    ${travelStyle ? `<span class="cover-tag">${travelStyle}</span>` : ''}
  </div>
</div>

<!-- Meta bar -->
<div class="meta-bar">
  <div class="meta-item"><label>Destination</label><span>${destination}</span></div>
  <div class="meta-item"><label>Duration</label><span>${duration} days</span></div>
  <div class="meta-item"><label>Budget</label><span>₹${Number(budget).toLocaleString('en-IN')}</span></div>
  ${travelMonth ? `<div class="meta-item"><label>Travel Month</label><span>${travelMonth}</span></div>` : ''}
  ${travelStyle ? `<div class="meta-item"><label>Travel Style</label><span style="text-transform:capitalize">${travelStyle}</span></div>` : ''}
</div>

<!-- Itinerary -->
<div class="section">
  <div class="section-label">📅 Day-by-Day Itinerary</div>
  ${itinerary.map(day => {
    const meals = day.meals || {}
    const tip   = day.tips || day.insider_tip || ''
    return `
    <div class="day-card">
      <div class="day-header">
        <div class="day-num">${String(day.day).padStart(2,'0')}</div>
        <div class="day-info">
          <small>Day ${day.day}</small>
          <h3>${day.title || `Day ${day.day}`}</h3>
          ${day.theme ? `<p>${day.theme}</p>` : ''}
        </div>
      </div>
      <div class="day-body">
        <div class="act-label">📍 Activities</div>
        ${(day.activities || []).map(a => `
          <div class="activity">
            <div class="act-dot"></div>
            <div class="act-text">${typeof a === 'string' ? a : JSON.stringify(a)}</div>
          </div>
        `).join('')}

        ${Object.keys(meals).length > 0 ? `
        <div class="act-label" style="margin-top:16px">🍽️ Meals</div>
        <div class="meals-grid">
          ${Object.entries(meals).map(([type, m]) => {
            const place = typeof m === 'string' ? m : (m?.place || '')
            const dish  = typeof m === 'object' ? (m?.dish  || '') : ''
            const cost  = typeof m === 'object' ? (m?.estimatedCost || '') : ''
            return `<div class="meal-card">
              <span style="font-size:20px">${type === 'breakfast' ? '🥐' : type === 'lunch' ? '🍱' : '🍷'}</span>
              <span class="meal-type">${type}</span>
              <div class="meal-place">${place}</div>
              ${dish ? `<div class="meal-dish">${dish}</div>` : ''}
              ${cost ? `<div class="meal-cost">₹${cost}</div>` : ''}
            </div>`
          }).join('')}
        </div>` : ''}

        ${tip ? `<div class="tip"><strong>💡 Pro tip: </strong>${tip}</div>` : ''}
      </div>
    </div>`
  }).join('')}
</div>

<!-- Weather -->
${weather ? `
<div class="section">
  <div class="section-label">🌤️ Weather Forecast</div>
  <div class="weather-card">
    <div class="weather-title">${weather.condition || 'Pleasant weather'}</div>
    <div class="weather-grid">
      <div class="weather-stat"><label>High / Low</label><span>${weather.temp_high || '--'}° / ${weather.temp_low || '--'}°C</span></div>
      <div class="weather-stat"><label>Humidity</label><span>${weather.humidity || '--'}%</span></div>
      <div class="weather-stat"><label>Rain Chance</label><span>${weather.rain_chance || 0}%</span></div>
    </div>
    ${weather.suggestion ? `<div class="weather-tip">💡 ${weather.suggestion}</div>` : ''}
  </div>
</div>` : ''}

<!-- Budget Breakdown -->
${budgetBreakdown ? `
<div class="section">
  <div class="section-label">💰 Budget Breakdown</div>
  <div class="budget-grid">
    ${Object.entries(budgetBreakdown)
      .filter(([k]) => k !== 'total' && k !== 'notes')
      .map(([k, v]) => `
      <div class="budget-row">
        <label>${k}</label>
        <span>${typeof v === 'number' ? '₹' + v.toLocaleString('en-IN') : v}</span>
      </div>`).join('')}
  </div>
  ${budgetBreakdown.total ? `
  <div class="budget-total">
    <label>Total Estimated</label>
    <span>₹${Number(budgetBreakdown.total).toLocaleString('en-IN')}</span>
  </div>` : ''}
</div>` : ''}

<!-- Packing List -->
${Object.keys(packing_list || {}).length > 0 ? `
<div class="section">
  <div class="section-label">🎒 Packing List</div>
  <div class="packing-grid">
    ${Object.entries(packing_list).map(([category, items]) => `
    <div class="pack-section">
      <h4>${category}</h4>
      ${(items || []).map(i => `
      <div class="pack-item">
        <div class="pack-check"></div>
        ${typeof i === 'string' ? i : (i.item || '')}
      </div>`).join('')}
    </div>`).join('')}
  </div>
</div>` : ''}

<!-- Footer -->
<div class="footer">Generated by WanderGenie · AI-powered travel planning</div>

</body>
</html>`

      // Open in new tab and trigger print dialog
      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
      win.onload = () => {
        setTimeout(() => {
          win.print()
        }, 500)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/10 hover:bg-white/8 transition-all font-body"
    >
      {exporting ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white/80 rounded-full animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          Export
        </>
      )}
    </button>
  )
}