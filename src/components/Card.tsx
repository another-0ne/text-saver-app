import React from 'react';

interface CardProps {
  item: {
    title: string;
    url: string;
    text: string;
  };
}

const Card: React.FC<CardProps> = ({ item }) => {
  return (
    <div className="card">
      <h2>{item.title}</h2>
      <a href={item.url}>{item.url}</a>
      <div>{item.text}</div>
    </div>
  );
};

export default Card;
