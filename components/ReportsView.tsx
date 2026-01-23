import React, { useEffect, useRef } from 'react';

// Dichiarazione per bypassare TypeScript check su libreria esterna CDN
declare var Chart: any;

const ReportsView: React.FC = () => {
  const funnelChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const deptChartRef = useRef<HTMLCanvasElement>(null);
  const satisfChartRef = useRef<HTMLCanvasElement>(null);

  // References to chart instances for cleanup
  const chartInstances = useRef<any[]>([]);

  useEffect(() => {
    // Cleanup previous charts
    chartInstances.current.forEach((chart) => chart.destroy());
    chartInstances.current = [];

    // --- CHART 1: CONVERSION FUNNEL (Bar Chart) ---
    if (funnelChartRef.current) {
      const ctx1 = funnelChartRef.current.getContext('2d');
      const chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Lead Totali', 'Contatti Utili', 'Colloqui Fatti', 'Iscritti'],
          datasets: [{
            label: 'Conversion Pipeline',
            data: [150, 100, 80, 55],
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)', // Blue
              'rgba(75, 192, 192, 0.6)', // Teal
              'rgba(255, 206, 86, 0.6)', // Yellow
              'rgba(0, 166, 90, 0.8)'     // NAM Green
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(255, 206, 86, 1)',
              '#00a65a'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
      chartInstances.current.push(chart1);
    }

    // --- CHART 2: REVENUE TREND (Line Chart) ---
    if (revenueChartRef.current) {
      const ctx2 = revenueChartRef.current.getContext('2d');
      const chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu (Prev)'],
          datasets: [{
            label: 'Fatturato (€)',
            data: [45000, 48000, 42000, 50000, 52000, 55000],
            borderColor: '#00a65a',
            backgroundColor: 'rgba(0, 166, 90, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#00a65a',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
             y: { 
                 beginAtZero: false,
                 grid: { borderDash: [5, 5] }
             }
          }
        }
      });
      chartInstances.current.push(chart2);
    }

    // --- CHART 3: DEPARTMENTS (Doughnut) ---
    if (deptChartRef.current) {
      const ctx3 = deptChartRef.current.getContext('2d');
      const chart3 = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: ['Canto', 'Pianoforte', 'Chitarra', 'Batteria', 'Produzione'],
          datasets: [{
            data: [35, 25, 20, 10, 10],
            backgroundColor: [
              '#FF6384', // Red/Pink
              '#36A2EB', // Blue
              '#FFCE56', // Yellow
              '#4BC0C0', // Teal
              '#9966FF'  // Purple
            ],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
             legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
      chartInstances.current.push(chart3);
    }

    // --- CHART 4: SATISFACTION (Radar) ---
    if (satisfChartRef.current) {
      const ctx4 = satisfChartRef.current.getContext('2d');
      const chart4 = new Chart(ctx4, {
        type: 'radar',
        data: {
          labels: ['Qualità Docenti', 'Struttura/Aule', 'Segreteria', 'Prezzo', 'Community'],
          datasets: [{
            label: 'Rating Medio (su 5)',
            data: [4.8, 4.2, 4.5, 3.9, 4.4],
            fill: true,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgb(153, 102, 255)',
            pointBackgroundColor: 'rgb(153, 102, 255)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(153, 102, 255)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { display: true },
              suggestedMin: 0,
              suggestedMax: 5
            }
          }
        }
      });
      chartInstances.current.push(chart4);
    }

    // Cleanup on unmount
    return () => {
       chartInstances.current.forEach((chart) => chart.destroy());
    };
  }, []);

  return (
    <div className="p-6 h-full flex flex-col relative overflow-y-auto">
      
      {/* 1. AI EXECUTIVE SUMMARY HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden flex-shrink-0">
         <div className="relative z-10 flex items-start">
             <div className="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                <i className="fas fa-brain text-2xl text-yellow-300 animate-pulse"></i>
             </div>
             <div>
                 <h2 className="text-2xl font-bold mb-2">🧠 Analisi Strategica AI</h2>
                 <p className="text-white/90 text-sm leading-relaxed max-w-4xl">
                    "L'analisi dei dati in tempo reale mostra un <strong className="text-green-300">fatturato in crescita del +12%</strong> rispetto al Q1 2025, trainato dall'ottima conversione dei Lead provenienti da Instagram (45%).
                    <br/><span className="text-yellow-300 font-bold"><i className="fas fa-exclamation-triangle mr-1"></i>ATTENZIONE:</span> Si rileva un calo fisiologico del 15% nelle iscrizioni ai corsi di Batteria. Si consiglia di attivare una promo 'Porta un Amico' o un Open Day dedicato entro fine mese."
                 </p>
             </div>
         </div>
         {/* Decorative Background Elements */}
         <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute left-20 top-0 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-shrink-0">
          
          {/* ROW 1 */}
          <div className="bg-white p-5 rounded shadow-sm border border-gray-200">
             <h3 className="text-gray-600 font-bold text-sm uppercase mb-4 border-b pb-2 flex justify-between">
                <span><i className="fas fa-filter mr-2 text-blue-500"></i>Conversion Funnel 2026</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">YTD</span>
             </h3>
             <div className="h-64 relative">
                 <canvas ref={funnelChartRef}></canvas>
             </div>
          </div>

          <div className="bg-white p-5 rounded shadow-sm border border-gray-200">
             <h3 className="text-gray-600 font-bold text-sm uppercase mb-4 border-b pb-2 flex justify-between">
                <span><i className="fas fa-chart-line mr-2 text-green-500"></i>Trend Fatturato</span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">+12% vs 2025</span>
             </h3>
             <div className="h-64 relative">
                 <canvas ref={revenueChartRef}></canvas>
             </div>
          </div>

          {/* ROW 2 */}
          <div className="bg-white p-5 rounded shadow-sm border border-gray-200">
             <h3 className="text-gray-600 font-bold text-sm uppercase mb-4 border-b pb-2">
                <i className="fas fa-chart-pie mr-2 text-purple-500"></i>Distribuzione Iscritti
             </h3>
             <div className="h-64 relative">
                 <canvas ref={deptChartRef}></canvas>
             </div>
          </div>

          <div className="bg-white p-5 rounded shadow-sm border border-gray-200">
             <h3 className="text-gray-600 font-bold text-sm uppercase mb-4 border-b pb-2">
                <i className="fas fa-star mr-2 text-yellow-500"></i>Soddisfazione & Feedback
             </h3>
             <div className="h-64 relative">
                 <canvas ref={satisfChartRef}></canvas>
             </div>
          </div>
      </div>

      {/* 3. TEACHER PERFORMANCE TABLE */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-8">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700"><i className="fas fa-trophy mr-2 text-yellow-500"></i>Top Performers (Docenti)</h3>
            <button className="text-xs text-nam-blue hover:underline font-bold">Vedi Classifica Completa</button>
         </div>
         <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
               <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N. Allievi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-right"></th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {[
                 { name: "M. Pavarotti", subject: "Canto", students: 22, retention: 98, rating: 5.0 },
                 { name: "Satriani M.", subject: "Chitarra", students: 18, retention: 95, rating: 4.9 },
                 { name: "Furian Maxx", subject: "Batteria", students: 25, retention: 92, rating: 4.8 },
                 { name: "Fasoli Daniele", subject: "Basso", students: 20, retention: 94, rating: 4.8 },
               ].map((teacher, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700">
                        {teacher.name} <span className="text-gray-400 font-normal text-xs ml-1">({teacher.subject})</span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-600">{teacher.students}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                           <span className="text-gray-700 font-bold mr-2">{teacher.retention}%</span>
                           <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${teacher.retention}%`}}></div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-yellow-500 font-bold">
                        <i className="fas fa-star mr-1"></i> {teacher.rating}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right">
                        {idx === 0 && <i className="fas fa-medal text-yellow-400 text-xl" title="Best Teacher"></i>}
                        {idx === 1 && <i className="fas fa-medal text-gray-400 text-xl"></i>}
                        {idx === 2 && <i className="fas fa-medal text-orange-400 text-xl"></i>}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

    </div>
  );
};

export default ReportsView;