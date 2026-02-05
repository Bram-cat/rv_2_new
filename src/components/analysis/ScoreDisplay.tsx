import { View, Text } from "react-native";
import { StarRating } from "../ui/StarRating";
import { ScoreBreakdown } from "../../types/analysis";
import { getRatingDescription } from "../../analysis/scoring";

interface ScoreDisplayProps {
  score: ScoreBreakdown;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <View className="bg-primary rounded-3xl p-6 items-center">
      {/* Header */}
      <Text className="text-white/80 text-sm font-medium mb-2">
        Overall Score
      </Text>

      {/* Main stars */}
      <StarRating rating={score.overallScore} size="large" color="#ffddd2" />

      {/* Score number */}
      <Text className="text-white text-5xl font-bold mt-2">
        {score.overallScore}/5
      </Text>

      {/* Rating description */}
      <Text className="text-white/90 text-lg mt-1">
        {getRatingDescription(score.overallScore)}
      </Text>

      {/* Sub-scores */}
      <View className="flex-row mt-6 w-full justify-around">
        <SubScore label="Filler" score={score.fillerScore} />
        <SubScore label="Pauses" score={score.pauseScore} />
        <SubScore label="Pace" score={score.paceScore} />
      </View>
    </View>
  );
}

function SubScore({ label, score }: { label: string; score: number }) {
  return (
    <View className="items-center">
      <Text className="text-white/70 text-xs mb-1">{label}</Text>
      <StarRating rating={score} size="small" color="#ffddd2" />
    </View>
  );
}
