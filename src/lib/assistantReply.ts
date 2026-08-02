import type { Lang } from '../context/LangContext'

const OFF_TOPIC_EN =
  'I can only help with MlihRent topics: rent status, payments, your apartment, maintenance tickets, and building support.'
const OFF_TOPIC_AR =
  'يمكنني المساعدة فقط في مواضيع MlihRent: الإيجار، الدفع، شقتك، الصيانة، ودعم المبنى.'

export function assistantReply(message: string, lang: Lang): { body: string; escalate: boolean } {
  const text = message.trim().toLowerCase()

  if (!text) {
    return {
      body:
        lang === 'ar'
          ? 'مرحباً! اسأل عن الإيجار أو الدفع أو شقتك أو الصيانة.'
          : 'Hello! Ask about rent, payments, your apartment, or maintenance.',
      escalate: false,
    }
  }

  if (/human|person|agent|staff|support|talk to someone|موظف|شخص|دعم|تحدث/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'سأحوّلك إلى موظف الدعم الآن. يرجى الانتظار.'
          : 'Connecting you to a support staff member now. Please wait.',
      escalate: true,
    }
  }

  if (/rent|paid|payment|invoice|dues|إيجار|دفع|مدفو/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'يمكنك مراجعة حالة الإيجار من الصفحة الرئيسية والدفع من تبويب دفع الإيجار.'
          : 'Check rent status on your home page and pay from the Pay rent tab.',
      escalate: false,
    }
  }

  if (/password|login|email|كلمة|دخول|بريد/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'يمكنك تغيير كلمة المرور من تبويب الملف. البريد وبيانات الشقة يديرها المدير فقط.'
          : 'Change your password in the Profile tab. Email and apartment details are managed by your admin only.',
      escalate: false,
    }
  }

  if (/maintenance|repair|ticket|plumb|electric|leak|صيانة|إصلاح|تذكرة|سباك|كهرب/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'للصيانة، افتح تبويب الصيانة وأرسل تذكرة. يمكنك أيضاً طلب موظف الدعم.'
          : 'For maintenance, open the Maintenance tab and submit a ticket. You can also request support staff.',
      escalate: /yes|staff|support|now|please|نعم|موظف|دعم|الآن|اريد|أريد/.test(text),
    }
  }

  if (/apartment|unit|building|floor|شقة|وحدة|مبنى|طابق/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'تفاصيل شقتك تظهر في الصفحة الرئيسية. لتعديل البيانات، تواصل مع إدارة المبنى.'
          : 'Your apartment details are on the home page. To update information, contact building admin.',
      escalate: false,
    }
  }

  if (/hello|hi|hey|marhaba|salam|مرحب|السلام/.test(text)) {
    return {
      body:
        lang === 'ar'
          ? 'مرحباً! أنا مساعد MlihRent. كيف يمكنني مساعدتك اليوم؟'
          : 'Hello! I am the MlihRent assistant. How can I help you today?',
      escalate: false,
    }
  }

  return {
    body: lang === 'ar' ? OFF_TOPIC_AR : OFF_TOPIC_EN,
    escalate: false,
  }
}
