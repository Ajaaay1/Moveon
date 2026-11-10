
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "ajsarsonas@gmail.com";
const PHONE_1 = "09605198902";
const PHONE_2 = "09533845614";

const faqs = [
  {
    question: "How do I book a ride?",
    answer:
      "Go to the Home screen, tap Choose Service, select Motorcycle, and tap Book Ride.",
  },
  {
    question: "How can I view my ride history?",
    answer:
      "Open the side menu and select History to view your previous ride bookings.",
  },
  {
    question: "What if I have a booking problem?",
    answer:
      "Contact our support team through email or phone. Please provide your booking details so we can assist you.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can email us at ajsarsonas@gmail.com or call one of the support numbers listed on this page.",
  },
  {
    question: "What if I have a payment concern?",
    answer:
      "Please contact our support team and provide the details of your payment concern.",
  },
];

export default function SupportPassenger() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Unable to Open",
        "No compatible application was found on your device."
      );
    }
  };

  // OPEN EMAIL APPLICATION
  const handleEmail = () => {
    const subject = encodeURIComponent(
      "MOB-ON Customer Support"
    );

    openLink(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}`
    );
  };

  // OPEN PHONE APPLICATION
  const handleCall = (number) => {
    openLink(`tel:${number}`);
  };

  // EXPAND OR COLLAPSE FAQ
  const toggleFAQ = (index) => {
    setExpandedFAQ(
      expandedFAQ === index ? null : index
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#0f172a"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Help & Support
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* WELCOME SECTION */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons
              name="headset-outline"
              size={36}
              color="#0284c7"
            />
          </View>

          <Text style={styles.welcomeTitle}>
            How can we help you?
          </Text>

          <Text style={styles.welcomeText}>
            Need assistance with your ride?
            Contact MOB-ON Support or browse
            our frequently asked questions.
          </Text>
        </View>

        {/* CONTACT SECTION */}
        <Text style={styles.sectionTitle}>
          Contact Us
        </Text>

        <Text style={styles.sectionDescription}>
          Choose how you want to contact
          our support team.
        </Text>

        {/* EMAIL CARD */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-outline"
              size={25}
              color="#0284c7"
            />
          </View>

          <View style={styles.contactDetails}>
            <Text style={styles.contactTitle}>
              Email Support
            </Text>

            <Text style={styles.contactValue}>
              {SUPPORT_EMAIL}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>

        {/* PHONE 1 */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleCall(PHONE_1)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="call-outline"
              size={25}
              color="#0284c7"
            />
          </View>

          <View style={styles.contactDetails}>
            <Text style={styles.contactTitle}>
              Call Support 1
            </Text>

            <Text style={styles.contactValue}>
              {PHONE_1}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>

        {/* PHONE 2 */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleCall(PHONE_2)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="call-outline"
              size={25}
              color="#0284c7"
            />
          </View>

          <View style={styles.contactDetails}>
            <Text style={styles.contactTitle}>
              Call Support 2
            </Text>

            <Text style={styles.contactValue}>
              {PHONE_2}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>

        {/* FAQ SECTION */}
        <Text style={styles.sectionTitle}>
          Frequently Asked Questions
        </Text>

        <Text style={styles.sectionDescription}>
          Find quick answers to common questions.
        </Text>

        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <View
              key={index}
              style={styles.faqItem}
            >
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(index)}
              >
                <Text style={styles.questionText}>
                  {faq.question}
                </Text>

                <Ionicons
                  name={
                    expandedFAQ === index
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>

              {expandedFAQ === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.answerText}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ADDITIONAL HELP */}
        <View style={styles.helpCard}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={30}
            color="#0284c7"
          />

          <Text style={styles.helpTitle}>
            Still Need Help?
          </Text>

          <Text style={styles.helpDescription}>
            If your concern was not answered
            above, send us an email describing
            your issue.
          </Text>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleEmail}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color="#fff"
            />

            <Text style={styles.helpButtonText}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text style={styles.footerText}>
          MOB-ON Customer Support
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0f172a",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  welcomeCard: {
    backgroundColor: "#e0f2fe",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
  },

  welcomeIcon: {
    width: 70,
    height: 70,
    backgroundColor: "#ffffff",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },

  welcomeText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 7,
    marginTop: 5,
  },

  sectionDescription: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },

  contactCard: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  contactDetails: {
    flex: 1,
  },

  contactTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },

  contactValue: {
    fontSize: 13,
    color: "#64748b",
  },

  faqContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 24,
  },

  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 17,
  },

  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    paddingRight: 12,
  },

  faqAnswer: {
    paddingHorizontal: 17,
    paddingBottom: 17,
  },

  answerText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 21,
  },

  helpCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 23,
    alignItems: "center",
  },

  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 8,
  },

  helpDescription: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
  },

  helpButton: {
    flexDirection: "row",
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  helpButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },

  footerText: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 12,
    color: "#94a3b8",
  },
});
