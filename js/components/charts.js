/**
 * SavvySpend — Chart.js Wrapper Component
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.components = window.SavvySpend.components || {};

  var activeCharts = [];

  var Charts = {
    createBarChart: function (canvasId, config) {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;

      var ctx = canvas.getContext('2d');
      var isDark = document.body.classList.contains('dark');
      
      var gridColor = isDark ? '#334155' : '#E5E7EB';
      var textColor = isDark ? '#94A3B8' : '#6B7280';
      var primaryColor = '#10B981';
      var secondaryColor = isDark ? '#334155' : '#E5E7EB';

      var datasets = [
        {
          label: 'This Period',
          data: config.data,
          backgroundColor: config.barColor || primaryColor,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 16
        }
      ];

      if (config.compareData) {
        datasets.push({
          label: 'Last Period',
          data: config.compareData,
          backgroundColor: secondaryColor,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 16
        });
      }

      var chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: config.labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // We render custom legends in HTML
            },
            tooltip: {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              titleColor: isDark ? '#F1F5F9' : '#111827',
              bodyColor: isDark ? '#94A3B8' : '#6B7280',
              borderColor: isDark ? '#334155' : '#E5E7EB',
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: function (context) {
                  return ' ' + context.dataset.label + ': ' + SavvySpend.formatCurrencyPlain(context.parsed.y);
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: textColor,
                font: {
                  family: 'Inter',
                  size: 11
                }
              },
              border: {
                display: false
              }
            },
            y: {
              grid: {
                color: gridColor,
                drawTicks: false
              },
              ticks: {
                color: textColor,
                font: {
                  family: 'Inter',
                  size: 11
                },
                callback: function (value) {
                  var symbol = (window.CURRENCIES[DataStore.getSettings().currency] || { symbol: 'GH₵' }).symbol;
                  if (value >= 1000) {
                    return symbol + (value / 1000) + 'k';
                  }
                  return symbol + value;
                }
              },
              border: {
                display: false
              }
            }
          }
        }
      });

      activeCharts.push(chart);
      return chart;
    },

    createDonutChart: function (canvasId, config) {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return null;

      var ctx = canvas.getContext('2d');
      var isDark = document.body.classList.contains('dark');
      
      var textColor = isDark ? '#F1F5F9' : '#111827';
      var subtitleColor = isDark ? '#94A3B8' : '#6B7280';

      var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: config.labels,
          datasets: [{
            data: config.data,
            backgroundColor: config.colors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              display: false // Custom HTML legend
            },
            tooltip: {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              titleColor: isDark ? '#F1F5F9' : '#111827',
              bodyColor: isDark ? '#94A3B8' : '#6B7280',
              borderColor: isDark ? '#334155' : '#E5E7EB',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: function (context) {
                  var val = context.parsed;
                  return ' ' + context.label + ': ' + SavvySpend.formatCurrencyPlain(val);
                }
              }
            }
          }
        },
        plugins: [{
          id: 'centerText',
          beforeDraw: function (chart) {
            if (config.centerText) {
              var width = chart.width,
                  height = chart.height,
                  ctx = chart.ctx;

              ctx.restore();
              ctx.font = '600 20px Inter';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = textColor;

              var text = config.centerText,
                  textX = Math.round((width - ctx.measureText(text).width) / 2),
                  textY = height / 2 - 10;

              ctx.fillText(text, textX, textY);

              ctx.font = '500 11px Inter';
              ctx.fillStyle = subtitleColor;
              var label = 'Total Spent',
                  labelX = Math.round((width - ctx.measureText(label).width) / 2),
                  labelY = height / 2 + 12;

              ctx.fillText(label, labelX, labelY);
              ctx.save();
            }
          }
        }]
      });

      activeCharts.push(chart);
      return chart;
    },

    destroyAll: function () {
      activeCharts.forEach(function (chart) {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      activeCharts = [];
    }
  };

  window.SavvySpend.components.Charts = Charts;
})();
