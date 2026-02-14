import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Crown, Star, Check, X, Zap, Shield, Users, BookOpen, MessageSquare, Calendar, Download } from "lucide-react";

const planFeatures = {
  free: [
    { name: "Basic profile", included: true },
    { name: "Up to 3 skills", included: true },
    { name: "Join public rooms", included: true },
    { name: "Schedule sessions", included: true },
    { name: "Access resources", included: true },
    { name: "Advanced matching", included: false },
    { name: "Unlimited partnerships", included: false },
    { name: "Priority support", included: false },
    { name: "Verified badges", included: false },
    { name: "Premium resources", included: false },
  ],
  pro: [
    { name: "Everything in Free", included: true },
    { name: "Advanced matching", included: true },
    { name: "Unlimited partnerships", included: true },
    { name: "Priority support", included: true },
    { name: "Verified badges", included: true },
    { name: "Access to premium resources", included: true },
  ],
  team: [
    { name: "Everything in Pro", included: true },
    { name: "Team management", included: true },
    { name: "Team analytics", included: true },
    { name: "Custom branding", included: true },
    { name: "API access", included: true },
    { name: "Dedicated support", included: true },
  ],
};

export default function Subscription() {
  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = trpc.subscription.getPlans.useQuery();
  
  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading, refetch } = trpc.subscription.getCurrentSubscription.useQuery();

  // Create checkout mutation
  const createCheckoutMutation = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // In production, redirect to Stripe checkout
      window.location.href = data.url;
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubscribe = (planId: number) => {
    createCheckoutMutation.mutate({
      planId,
      successUrl: `${window.location.origin}/subscription?success=true`,
      cancelUrl: `${window.location.origin}/subscription?cancelled=true`,
    });
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("free")) return Users;
    if (name.includes("pro")) return Star;
    if (name.includes("team")) return Crown;
    return Zap;
  };

  // Default plans if none from API
  const defaultPlans = [
    {
      id: 1,
      name: "Free",
      description: "Get started with basic features",
      price: 0,
      billingPeriod: "forever",
      features: planFeatures.free,
    },
    {
      id: 2,
      name: "Pro",
      description: "Unlock all learning features",
      price: 9.99,
      billingPeriod: "month",
      features: planFeatures.pro,
      popular: true,
    },
    {
      id: 3,
      name: "Team",
      description: "For teams and organizations",
      price: 29.99,
      billingPeriod: "month",
      features: planFeatures.team,
    },
  ];

  const displayPlans = plans && plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-8 h-8" />
          Subscription
        </h1>
        <p className="text-muted-foreground mt-2">
          Upgrade your learning experience with premium features
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {currentSubscription.plan?.name || "Current Plan"}
                  </h2>
                  <Badge className={
                    currentSubscription.status === "active" 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-yellow-500/20 text-yellow-500"
                  }>
                    {currentSubscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentSubscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                    : currentSubscription.currentPeriodEnd 
                      ? `Renews on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                      : "Free plan"
                  }
                </p>
              </div>
              {currentSubscription.status === "active" && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map((plan: any) => {
          const Icon = getPlanIcon(plan.name);
          const isCurrentPlan = currentSubscription?.planId === plan.id;
          const features = planFeatures[plan.name.toLowerCase() as keyof typeof planFeatures] || plan.features;
          
          return (
            <Card key={plan.id} className={plan.popular ? "border-primary shadow-lg" : ""}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{plan.billingPeriod}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {features.map((feature: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.price === 0 ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    Free Forever
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={createCheckoutMutation.isPending}
                  >
                    {createCheckoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        Subscribe Now
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">What payment methods are accepted?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              We accept all major credit cards, debit cards, and PayPal through our secure payment processor.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">Is there a free trial?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Pro subscribers get a 7-day free trial. You won't be charged until the trial ends.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Your data will be preserved. Some premium features will be disabled, but you can always upgrade again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
