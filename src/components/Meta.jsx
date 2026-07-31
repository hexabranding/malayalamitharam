import { CalendarDays, Clock3, MessageCircle } from "lucide-react";

export default function Meta({ article }) {
  return (
    <div className="meta">
      <span><CalendarDays size={15} />{article.date}</span>
      <span><Clock3 size={15} />{article.readTime}</span>
      <span><MessageCircle size={15} />{article.comments}</span>
    </div>
  );
}
