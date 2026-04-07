import React from 'react';

interface SummaryCardsProps {
  revenue: number;
  cost: number;
  profit: number;
  debt: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ revenue, cost, profit, debt }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    { label: 'Doanh thu dự tính', value: revenue, id: 'summaryRevenue', className: 'card-primary' },
    { label: 'Giá vốn hàng hóa', value: cost, id: 'summaryCost' },
    { label: 'Lợi nhuận dự kiến', value: profit, id: 'summaryProfit', colorClass: 'text-success' },
    { label: 'Tổng dư nợ phải thu', value: debt, id: 'summaryDebt', colorClass: 'text-danger' },
  ];

  return (
    <section className="hero-cards">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`summary-card glass reveal show ${card.className || ''} flex flex-col justify-center p-6`}
          style={{ transitionDelay: `${idx * 0.1}s` }}
        >
          <span className="text-slate-500 font-medium text-sm mb-1">{card.label}</span>
          <strong id={card.id} className={`text-2xl block tracking-tight font-extrabold ${card.colorClass || 'text-slate-800'}`}>
            {formatCurrency(card.value)}
          </strong>
        </div>
      ))}
    </section>
  );
};

export default SummaryCards;
