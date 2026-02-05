import { View, Text } from "react-native";

interface FeedbackListProps {
  feedback: string[];
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (feedback.length === 0) {
    return null;
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Feedback</Text>
      {feedback.map((item, index) => (
        <View key={index} className="flex-row items-start mb-2">
          <Text className="text-primary-600 mr-2 text-lg">•</Text>
          <Text className="text-gray-700 flex-1 leading-5">{item}</Text>
        </View>
      ))}
    </View>
  );
}
