import { Language } from '../translations';

export interface Thread {
  id: number;
  author: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  replies: { author: string, text: string, isSolution?: boolean }[];
  time: string;
  verified: boolean;
}

const authors = [
  'Dr. Sarah Smith', 'Mark Johnson', 'Emily Chen', 'Prof. Nguyen Van A', 
  'Alex Rivera', 'Jessica Wu', 'Dr. Liam O\'Connor', 'Sophia Martinez',
  'David Kim', 'Elena Rossi', 'Chris Evans', 'Dr. Maya Patel'
];

const tagsPool = [
  'Genetics', 'ClinicalCase', 'PatientCare', 'Metabolism', 'Nutrition', 
  'Wearables', 'Physiology', 'Biochemistry', 'Cardiology', 'Neurology',
  'Endocrinology', 'Immunology', 'Pharmacology', 'Bioinformatics'
];

const topics = [
  {
    en: { title: 'Understanding CRISPR in 2026', content: 'CRISPR technology has advanced significantly. How are we seeing it applied in clinical settings today?' },
    vi: { title: 'Hiểu về CRISPR năm 2026', content: 'Công nghệ CRISPR đã tiến bộ vượt bậc. Chúng ta đang thấy nó được ứng dụng như thế nào trong lâm sàng hiện nay?' },
    tags: ['Genetics', 'Bioinformatics']
  },
  {
    en: { title: 'Managing Hypertension with AI', content: 'My Bio-Digital Twin suggested a change in my salt intake. Has anyone else experienced this?' },
    vi: { title: 'Quản lý cao huyết áp bằng AI', content: 'Bản sao số sinh học của tôi đề xuất thay đổi lượng muối nạp vào. Có ai khác trải nghiệm điều này chưa?' },
    tags: ['Cardiology', 'Wearables']
  },
  {
    en: { title: 'The Role of Microbiome in Mental Health', content: 'Recent studies show a strong link between gut health and depression. What are your thoughts?' },
    vi: { title: 'Vai trò của vi sinh vật đối với sức khỏe tâm thần', content: 'Các nghiên cứu gần đây cho thấy mối liên hệ chặt chẽ giữa sức khỏe đường ruột và trầm cảm. Bạn nghĩ sao?' },
    tags: ['Metabolism', 'Neurology']
  },
  {
    en: { title: 'Rare Disease: Wilson Disease Case', content: 'A patient presented with Kayser-Fleischer rings and tremors. ATP7B mutation confirmed.' },
    vi: { title: 'Bệnh hiếm: Ca bệnh Wilson', content: 'Bệnh nhân có vòng Kayser-Fleischer và run tay. Đã xác nhận đột biến ATP7B.' },
    tags: ['Genetics', 'ClinicalCase']
  },
  {
    en: { title: 'Intermittent Fasting and Insulin Sensitivity', content: 'I have seen a 15% drop in fasting glucose after 2 months of 16:8 fasting.' },
    vi: { title: 'Nhịn ăn gián đoạn và độ nhạy Insulin', content: 'Tôi đã thấy mức đường huyết lúc đói giảm 15% sau 2 tháng nhịn ăn 16:8.' },
    tags: ['Metabolism', 'Nutrition']
  }
];

export const generateMockThreads = (lang: Language): Thread[] => {
  const threads: Thread[] = [];
  
  // Add 100 threads
  for (let i = 1; i <= 100; i++) {
    const topicIndex = i % topics.length;
    const authorIndex = i % authors.length;
    const topic = topics[topicIndex];
    
    threads.push({
      id: i,
      author: authors[authorIndex],
      title: lang === 'vi' ? topic.vi.title + ` #${i}` : topic.en.title + ` #${i}`,
      content: lang === 'vi' ? topic.vi.content : topic.en.content,
      tags: topic.tags,
      likes: Math.floor(Math.random() * 200),
      replies: i % 3 === 0 ? [
        { author: 'Dr. Expert', text: lang === 'vi' ? 'Đây là một quan sát rất tốt.' : 'This is a very good observation.', isSolution: true },
        { author: 'User123', text: lang === 'vi' ? 'Cảm ơn đã chia sẻ!' : 'Thanks for sharing!' }
      ] : [],
      time: `${Math.floor(Math.random() * 24)}h ago`,
      verified: i % 4 === 0
    });
  }
  
  return threads;
};
