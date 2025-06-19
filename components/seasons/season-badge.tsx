import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Star } from "lucide-react"
import type { SeasonBadge } from "@/types/seasons"

interface SeasonBadgeProps {
  badge: SeasonBadge
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
}

const badgeConfig = {
  champion: {
    icon: Trophy,
    label: "Season Champion",
    color: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    textColor: "text-yellow-900",
    borderColor: "border-yellow-500",
  },
  runner_up: {
    icon: Medal,
    label: "Runner Up",
    color: "bg-gradient-to-r from-gray-300 to-gray-500",
    textColor: "text-gray-800",
    borderColor: "border-gray-400",
  },
  bronze: {
    icon: Award,
    label: "Bronze Medal",
    color: "bg-gradient-to-r from-orange-400 to-orange-600",
    textColor: "text-orange-900",
    borderColor: "border-orange-500",
  },
  fourth: {
    icon: Star,
    label: "Top 4 Finisher",
    color: "bg-gradient-to-r from-purple-400 to-purple-600",
    textColor: "text-purple-900",
    borderColor: "border-purple-500",
  },
}

export const SeasonBadgeComponent = ({ badge, size = "md", showDetails = false }: SeasonBadgeProps) => {
  const config = badgeConfig[badge.badge_type]
  const Icon = config.icon

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const badgeSizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  }

  if (showDetails) {
    return (
      <div
        className={`inline-flex items-center ${config.color} ${config.textColor} ${badgeSizeClasses[size]} rounded-full font-semibold shadow-lg border-2 ${config.borderColor}`}
      >
        <Icon className={`${sizeClasses[size]} mr-2`} />
        <div className="flex flex-col items-start">
          <span className="font-bold">{config.label}</span>
          <span className="text-xs opacity-90">
            {badge.total_games} games • {badge.win_rate}% win rate
          </span>
        </div>
      </div>
    )
  }

  return (
    <Badge
      className={`${config.color} ${config.textColor} ${badgeSizeClasses[size]} border-2 ${config.borderColor} shadow-md`}
    >
      <Icon className={`${sizeClasses[size]} mr-1`} />
      {config.label}
    </Badge>
  )
}
