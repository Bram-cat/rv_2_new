import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import {
  ChallengeDefinition,
  CHALLENGES,
  ChallengeDifficulty,
  DIFFICULTY_LABELS,
} from "../../src/constants/challenges";

function ChallengeCard({
  challenge,
  onPress,
}: {
  challenge: ChallengeDefinition;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-card rounded-2xl p-5 mb-4 border border-secondary-light"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: challenge.color + "20" }}
          className="w-14 h-14 rounded-xl items-center justify-center mr-4"
        >
          <Ionicons name={challenge.icon} size={28} color={challenge.color} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-primary-dark">
            {challenge.name}
          </Text>
          <Text className="text-sm text-secondary-dark mt-1">
            {challenge.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#83c5be" />
      </View>
    </TouchableOpacity>
  );
}

function DifficultySelector({
  challenge,
  onSelectDifficulty,
  onBack,
}: {
  challenge: ChallengeDefinition;
  onSelectDifficulty: (difficulty: ChallengeDifficulty) => void;
  onBack: () => void;
}) {
  const difficulties: ChallengeDifficulty[] = ["easy", "medium", "hard"];

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case "easy":
        return "#83c5be";
      case "medium":
        return "#e29578";
      case "hard":
        return "#c84b31";
    }
  };

  return (
    <View className="flex-1">
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-4">
        <Ionicons name="arrow-back" size={24} color="#006d77" />
        <Text className="text-primary ml-2">Back to challenges</Text>
      </TouchableOpacity>

      <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary-light">
        <View className="flex-row items-center mb-4">
          <View
            style={{ backgroundColor: challenge.color + "20" }}
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
          >
            <Ionicons name={challenge.icon} size={28} color={challenge.color} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-primary-dark">
              {challenge.name}
            </Text>
            <Text className="text-sm text-secondary-dark mt-1">
              {challenge.description}
            </Text>
          </View>
        </View>

        <View className="bg-primary-light/50 rounded-xl p-4">
          <Text className="text-sm font-semibold text-primary-dark mb-2">
            Pro Tips:
          </Text>
          {challenge.tips.slice(0, 3).map((tip, index) => (
            <View key={index} className="flex-row items-start mt-2">
              <Ionicons name="bulb-outline" size={16} color={challenge.color} />
              <Text className="text-sm text-primary-dark ml-2 flex-1">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text className="text-lg font-semibold text-primary-dark mb-4">
        Select Difficulty
      </Text>

      {difficulties.map((difficulty) => {
        const level = challenge.difficultyLevels[difficulty];
        const durationMin = Math.floor(level.duration / 60);
        const color = getDifficultyColor(difficulty);

        return (
          <TouchableOpacity
            key={difficulty}
            onPress={() => onSelectDifficulty(difficulty)}
            className="bg-background-card rounded-xl p-4 mb-3 border border-secondary-light"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: color + "30" }}
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                >
                  <Ionicons
                    name={
                      difficulty === "easy"
                        ? "leaf-outline"
                        : difficulty === "medium"
                          ? "flame-outline"
                          : "skull-outline"
                    }
                    size={20}
                    color={color}
                  />
                </View>
                <View>
                  <Text className="text-base font-semibold text-primary-dark">
                    {DIFFICULTY_LABELS[difficulty]}
                  </Text>
                  <Text className="text-xs text-secondary-dark">
                    {durationMin} min • Target:{" "}
                    {challenge.scoringMetric === "fillerRatio"
                      ? `<${level.target * 100}% fillers`
                      : challenge.scoringMetric === "paceVariance"
                        ? `<${level.target} WPM variance`
                        : `${level.target}/10 clarity`}
                  </Text>
                </View>
              </View>
              <Ionicons name="play-circle" size={32} color={color} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const [selectedChallenge, setSelectedChallenge] =
    useState<ChallengeDefinition | null>(null);

  const handleSelectChallenge = (challenge: ChallengeDefinition) => {
    setSelectedChallenge(challenge);
  };

  const handleSelectDifficulty = (difficulty: ChallengeDifficulty) => {
    if (selectedChallenge) {
      router.push({
        pathname: "/practice/record/challenge",
        params: {
          challengeType: selectedChallenge.id,
          difficulty: difficulty,
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#006d77" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-primary-dark">
              {selectedChallenge ? "Select Difficulty" : "Challenges"}
            </Text>
          </View>
          <Text className="text-secondary-dark">
            {selectedChallenge
              ? "Choose your challenge level"
              : "Level up specific speaking skills"}
          </Text>
        </View>

        <View className="px-6">
          {selectedChallenge ? (
            <DifficultySelector
              challenge={selectedChallenge}
              onSelectDifficulty={handleSelectDifficulty}
              onBack={() => setSelectedChallenge(null)}
            />
          ) : (
            <>
              {CHALLENGES.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => handleSelectChallenge(challenge)}
                />
              ))}

              {/* Info Section */}
              <View className="bg-primary-light rounded-2xl p-5 mt-4">
                <View className="flex-row items-start mb-3">
                  <Ionicons name="trophy-outline" size={20} color="#006d77" />
                  <Text className="text-primary-dark ml-3 flex-1">
                    Complete challenges to earn scores and track your
                    improvement
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="ribbon-outline" size={20} color="#006d77" />
                  <Text className="text-primary-dark ml-3 flex-1">
                    Higher difficulty = higher potential scores!
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
