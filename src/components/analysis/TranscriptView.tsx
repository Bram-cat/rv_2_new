import { View, Text, ScrollView } from "react-native";
import { FillerWordResult } from "../../types/analysis";
import { STRICT_FILLER_WORDS } from "../../constants/fillerWords";

interface TranscriptViewProps {
  text: string;
  fillerWords?: FillerWordResult[];
  maxHeight?: number;
}

export function TranscriptView({
  text,
  fillerWords = [],
  maxHeight = 200,
}: TranscriptViewProps) {
  // Get all filler words that were detected
  const detectedFillers = new Set(fillerWords.map((f) => f.word.toLowerCase()));

  // Split text into words and highlight filler words
  const words = text.split(/(\s+)/);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator>
        <Text className="text-gray-700 leading-6">
          {words.map((word, index) => {
            const normalizedWord = word
              .toLowerCase()
              .replace(/[.,!?;:'"]/g, "");
            const isFiller =
              detectedFillers.has(normalizedWord) ||
              STRICT_FILLER_WORDS.includes(normalizedWord);

            if (isFiller && word.trim()) {
              return (
                <Text
                  key={index}
                  className="bg-yellow-200 text-yellow-800 rounded px-0.5"
                >
                  {word}
                </Text>
              );
            }

            return <Text key={index}>{word}</Text>;
          })}
        </Text>
      </ScrollView>

      {/* Legend */}
      {fillerWords.length > 0 && (
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
          <View className="w-3 h-3 bg-yellow-200 rounded mr-2" />
          <Text className="text-xs text-gray-500">
            Highlighted words are filler words
          </Text>
        </View>
      )}
    </View>
  );
}
