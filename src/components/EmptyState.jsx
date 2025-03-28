import React from 'react';

const EmptyState = ({ 
  icon = '📝', 
  title = 'No Data', 
  message = 'No data available yet', 
  actionLabel = 'Add Data',
  onAction = () => {} 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <div className="text-gray-400 mb-4 text-5xl">{icon}</div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      <button 
        onClick={onAction}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors btn-bounce"
      >
        {actionLabel}
      </button>
    </div>
  );
};

export default EmptyState; 