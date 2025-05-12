
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cva } from "class-variance-authority";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  gradient: "pink" | "teal" | "mixed";
}

const gradientVariants = cva("", {
  variants: {
    gradient: {
      pink: "bg-gradient-to-br from-tiktool-pink/20 to-tiktool-pink/5 hover:from-tiktool-pink/30 hover:to-tiktool-pink/10",
      teal: "bg-gradient-to-br from-tiktool-teal/20 to-tiktool-teal/5 hover:from-tiktool-teal/30 hover:to-tiktool-teal/10",
      mixed: "bg-gradient-to-br from-tiktool-pink/20 to-tiktool-teal/20 hover:from-tiktool-pink/30 hover:to-tiktool-teal/30",
    },
  },
  defaultVariants: {
    gradient: "mixed",
  },
});

const FeatureCard = ({ title, description, icon, to, gradient }: FeatureCardProps) => {
  return (
    <Link to={to}>
      <Card className={`border-tiktool-gray/50 h-full transition-all duration-300 ${gradientVariants({ gradient })}`}>
        <CardContent className="pt-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-full bg-tiktool-dark flex items-center justify-center mb-4">
            {icon}
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FeatureCard;
