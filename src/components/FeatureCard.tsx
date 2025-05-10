
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  gradient?: "pink" | "teal" | "mixed";
}

const FeatureCard = ({ title, description, icon, to, gradient = "pink" }: FeatureCardProps) => {
  let gradientClass = "from-tiktool-pink to-tiktool-pink/50";
  
  if (gradient === "teal") {
    gradientClass = "from-tiktool-teal to-tiktool-teal/50";
  } else if (gradient === "mixed") {
    gradientClass = "from-tiktool-pink to-tiktool-teal";
  }
  
  return (
    <Card className="bg-tiktool-gray border-tiktool-gray/50 overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-tiktool-gray/50 mb-4">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
      <CardFooter>
        <Link to={to} className="w-full">
          <Button className="w-full bg-gradient-to-r from-tiktool-pink to-tiktool-teal hover:opacity-90">
            Acessar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FeatureCard;
