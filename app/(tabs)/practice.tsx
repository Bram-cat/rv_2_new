import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface ModeCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  features: string[];
}

function ModeCard({
  title,
  description,
  icon,
  color,
  onPress,
  features,
}: ModeCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-card rounded-2xl p-5 mb-4 border border-secondary-light"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start mb-3">
        <View
          style={{ backgroundColor: color + "20" }}
          className="w-14 h-14 rounded-xl items-center justify-center mr-4"
        >
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-primary-dark">
            {title}
          </Text>
          <Text className="text-sm text-secondary-dark mt-1">
            {description}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#83c5be" />
      </View>
      <View className="mt-2">
        {features.map((feature, index) => (
          <View key={index} className="flex-row items-center mt-2">
            <Ionicons name="checkmark-circle" size={16} color={color} />
            <Text className="text-sm text-secondary-dark ml-2">{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function PracticeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-primary-dark">
            Practice Modes
          </Text>
          <Text className="text-secondary-dark mt-1">
            Choose how you want to practice today
          </Text>
        </View>

        {/* Practice Mode Cards */}
        <View className="px-6">
          <ModeCard
            title="Free Practice"
            description="Unlimited recording with basic AI feedback"
            icon="infinite-outline"
            color="#006d77"
            onPress={() => router.push("/practice/free")}
            features={[
              "No time limits",
              "Basic speech analysis",
              "AI coaching feedback",
            ]}
          />

          <ModeCard
            title="Structured Practice"
            description="Time-bound sessions with industry templates"
            icon="list-outline"
            color="#e29578"
            onPress={() => router.push("/practice/templates")}
            features={[
              "10 industry-specific templates",
              "Timed presentations (1-10 min)",
              "Context-aware AI feedback",
            ]}
          />

          <ModeCard
            title="Challenge Mode"
            description="Gamified challenges to level up your skills"
            icon="trophy-outline"
            color="#83c5be"
            onPress={() => router.push("/practice/challenges")}
            features={[
              "Filler word elimination",
              "Pace consistency training",
              "Clear articulation drills",
            ]}
          />
        </View>

        {/* Tips Section */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-primary-dark mb-3">
            Getting Started
          </Text>
          <View className="bg-primary-light rounded-2xl p-5">
            <View className="flex-row items-start mb-3">
              <Ionicons name="sparkles-outline" size={20} color="#006d77" />
              <Text className="text-primary-dark ml-3 flex-1">
                Start with Free Practice to get comfortable with the app
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Ionicons name="calendar-outline" size={20} color="#006d77" />
              <Text className="text-primary-dark ml-3 flex-1">
                Practice 5-10 minutes daily for best results
              </Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="trending-up-outline" size={20} color="#006d77" />
              <Text className="text-primary-dark ml-3 flex-1">
                Use Challenge Mode to target specific weaknesses
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
