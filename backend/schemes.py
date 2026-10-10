"""Scheme catalog. Add new schemes here; the frontend renders them automatically."""

def L(en, ta, hi):
    return {"English": en, "Tamil": ta, "Hindi": hi}

SCHEMES = {
    "pudhumai_penn": {
        "title": L("Pudhumai Penn / Tamil Pudhalvan Scheme",
                   "புதுமைப் பெண் / தமிழ்ப் புதல்வன் திட்டம்",
                   "पुधुमई पेन / तमिल पुधलवन योजना"),
        "badge": L("₹1,000 / Month Direct Bank Benefit",
                   "மாதம் ₹1,000 நேரடி வங்கி உதவி",
                   "₹1,000 प्रति माह प्रत्यक्ष लाभ (DBT)"),
        "desc": L("Monthly financial support paid straight to the bank accounts of eligible students in higher education.",
                  "உயர்கல்வி பயிலும் மாணவர்களுக்கு மாதம் ₹1,000 நேரடியாக வங்கிக் கணக்கில் வழங்கப்படுகிறது.",
                  "उच्च शिक्षा कर रहे पात्र छात्रों के खाते में सीधे ₹1,000 प्रति माह जमा किए जाते हैं।"),
        "benefits": {
            "English": ["₹1,000 per month credited to your Aadhaar-seeded bank account.",
                        "Paid until degree completion (up to 3–4 years)."],
            "Tamil": ["ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கில் மாதம் ₹1,000 வரவு.",
                      "படிப்பு முடியும் வரை தொடர்ந்து வழங்கப்படும்."],
            "Hindi": ["आधार से जुड़े बैंक खाते में प्रति माह ₹1,000।",
                      "डिग्री पूरी होने तक निरंतर सहायता।"],
        },
        "documents": [
            {"id": "aadhar_card", "label": L("Aadhaar Card", "ஆதார் அட்டை", "आधार कार्ड")},
            {"id": "school_bonafide", "label": L("Class 6–12 Govt/Aided School Certificate",
                                                 "6–12 ஆம் வகுப்பு அரசுப் பள்ளி சான்றிதழ்",
                                                 "कक्षा 6–12 सरकारी स्कूल प्रमाण पत्र")},
            {"id": "college_bonafide", "label": L("College Bonafide / Admission Receipt",
                                                 "கல்லூரி போனாஃபைட் சான்றிதழ்",
                                                 "कॉलेज प्रवेश पत्र / बोनाफाइड")},
            {"id": "bank_passbook", "label": L("Bank Passbook Front Page",
                                               "வங்கி பாஸ்புக் முதல் பக்கம்",
                                               "बैंक पासबुक का पहला पृष्ठ")},
        ],
    },
    "post_matric": {
        "title": L("Post-Matric Higher Education Scholarship",
                   "போஸ்ட்-மெட்ரிக் உயர் கல்வி உதவித்தொகை",
                   "पोस्ट-मैट्रिक उच्च शिक्षा छात्रवृत्ति"),
        "badge": L("100% Tuition Fee Waiver + Monthly Allowance",
                   "முழு கல்லூரி கட்டண தள்ளுபடி + மாத நிதி",
                   "100% ट्यूशन फीस माफी + मासिक भत्ता"),
        "desc": L("Full tuition coverage and a maintenance stipend for low-income students in tertiary education.",
                  "குறைந்த வருமான குடும்ப மாணவர்களுக்கு கல்லூரி கட்டணம் முழுவதும் தள்ளுபடி.",
                  "कम आय वाले छात्रों के लिए 100% फीस माफी और रखरखाव अनुदान।"),
        "benefits": {
            "English": ["100% tuition and institutional fee waiver, paid directly to the college.",
                        "Annual allowance of ₹5,000–₹12,000 depending on hostel/day-scholar status."],
            "Tamil": ["கல்விக்கட்டணம் முழுவதும் அரசே நேரடியாக செலுத்தும்.",
                      "ஆண்டுக்கு ₹5,000 முதல் ₹12,000 வரை பராமரிப்பு உதவித்தொகை."],
            "Hindi": ["100% ट्यूशन फीस की सीधे कॉलेज को प्रतिपूर्ति।",
                      "₹5,000 से ₹12,000 तक वार्षिक रखरखाव भत्ता।"],
        },
        "documents": [
            {"id": "aadhar_card", "label": L("Aadhaar Card", "ஆதார் அட்டை", "आधार कार्ड")},
            {"id": "marksheet", "label": L("12th Standard Marksheet", "12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்", "12वीं की अंकतालिका")},
            {"id": "income_certificate", "label": L("Income Certificate", "வருமான சான்றிதழ்", "आय प्रमाण पत्र")},
            {"id": "community_certificate", "label": L("Community Certificate", "சாதி சான்றிதழ்", "जाति प्रमाण पत्र")},
            {"id": "bank_passbook", "label": L("Bank Passbook Front Page", "வங்கி பாஸ்புக் முதல் பக்கம்", "बैंक पासबुक का पहला पृष्ठ")},
        ],
    },
}
