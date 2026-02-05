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
    <View
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor: "#034569",
        borderColor: "#21628830",
      }}
    >
      <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator>
        <Text
          className="leading-6"
          style={{
            fontFamily: "CabinetGrotesk-Light",
            color: "#8ecae6",
          }}
        >
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
                  className="rounded px-0.5"
                  style={{
                    backgroundColor: "#fb850040",
                    color: "#fb8500",
                    fontFamily: "CabinetGrotesk-Medium",
                  }}
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
        <View
          className="flex-row items-center mt-3 pt-3 border-t"
          style={{ borderColor: "#21628830" }}
        >
          <View
            className="w-3 h-3 rounded mr-2"
            style={{ backgroundColor: "#fb850040" }}
          />
          <Text
            className="text-xs"
            style={{
              fontFamily: "CabinetGrotesk-Light",
              color: "#6bb8d4",
            }}
          >
            Highlighted words are filler words
          </Text>
        </View>
      )}
    </View>
  );
}
