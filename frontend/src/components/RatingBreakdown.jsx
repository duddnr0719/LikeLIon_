function RatingBreakdown({ ratings }) {
  const categories = [
    { key: 'rating_infrastructure', label: '시설' },
    { key: 'rating_atmosphere', label: '분위기' },
    { key: 'rating_furniture', label: '가구' },
    { key: 'rating_comfort', label: '편안함' },
  ];

  return (
    <div className="rating-breakdown">
      {categories.map(({ key, label }) => (
        <div key={key} className="rating-row">
          <span>{label}</span>
          <span>{ratings?.[key] ?? '-'} / 5</span>
        </div>
      ))}
    </div>
  );
}

export default RatingBreakdown;
