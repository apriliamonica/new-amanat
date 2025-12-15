const Card = ({ children, className = "", hover = false, onClick }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200/60 ${
        hover ? "card-hover cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
