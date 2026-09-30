// Reviewed first-party sources. Base/instruct copies, quantizations and later
// platform rollouts are not counted twice. See research/ai-releases/README.md.
export function addOtherPublishers(add){
 const google='https://ai.google.dev/gemini-api/docs/changelog',ds='https://api-docs.deepseek.com/updates/',glm='https://docs.z.ai/release-notes/new-released',mistral='https://docs.mistral.ai/getting-started/changelog';
 add('2023-03-21','google','Bard (LaMDA)','https://blog.google/innovation-and-ai/products/try-bard/','general','First consumer rollout in the US/UK, with a waitlist. February 6 was an announcement. Bard is the service; LaMDA was its underlying model.','limited-beta');
 add('2023-05-10','google','PaLM 2 (Bard)','https://blog.google/innovation-and-ai/products/google-palm-2-ai-large-language-model/');
 add('2023-12-06','google','Gemini 1.0 Pro','https://blog.google/innovation-and-ai/technology/ai/google-gemini-ai/','general','First access through Bard; API followed December 13. Ultra was not available yet.');
 add('2024-02-08','google','Gemini 1.0 Ultra','https://blog.google/intl/es-419/actualizaciones-de-producto/informacion/bard-se-convierte-en-gemini-ultra-10-y-una-nueva-aplicacion-movil/','general','Gemini Advanced launch. Bard rename is not an additional model.');
 add('2024-02-15','google','Gemini 1.5 Pro','https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/','general','Limited developer preview with sign-up; broader API preview followed April 9.','limited-beta');
 add('2024-05-10','google','Gemini 1.5 Flash',google,'general','API changelog dates preview availability May 10; Google I/O announcement followed May 14.','public-preview');
 add('2024-08-27','google','Gemini 1.5 Flash-8B',google,'general','Experimental preview; October GA is not counted again.','public-preview');
 add('2024-12-11','google','Gemini 2.0 Flash',google,'general','First experimental preview; February GA is not counted again.','public-preview');
 add('2025-02-05','google','Gemini 2.0 Pro|Gemini 2.0 Flash-Lite',google,'general','First public experimental previews.','public-preview');
 add('2025-03-25','google','Gemini 2.5 Pro',google,'general','Experimental first availability; April paid preview and June GA are not new entries.','public-preview');
 add('2025-04-17','google','Gemini 2.5 Flash',google,'general','','public-preview');
 add('2025-06-17','google','Gemini 2.5 Flash-Lite',google,'general','First preview, before July GA.','public-preview');
 add('2025-11-18','google','Gemini 3 Pro',google,'general','','public-preview');
 add('2025-12-17','google','Gemini 3 Flash',google,'general','','public-preview');
 add('2026-02-19','google','Gemini 3.1 Pro',google,'general','','public-preview');
 add('2026-03-03','google','Gemini 3.1 Flash-Lite',google,'general','','public-preview');
 add('2026-05-19','google','Gemini 3.5 Flash',google);
 add('2026-07-21','google','Gemini 3.6 Flash|Gemini 3.5 Flash-Lite',google);
 add('2026-08-13','google','Gemini 3.7 Flash',google);
 add('2026-09-02','google','Gemini 3.8 Flash',google);
 add('2026-09-30','google','Gemini 4 Argon','https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/','restricted','Announcement and rollout to trusted cyber defenders in Fairwind. NOT a public API/consumer release. Public availability is not dated in this snapshot.','partner-access');

 add('2024-05-06','deepseek','DeepSeek-V2','https://github.com/deepseek-ai/DeepSeek-V2','open-weight','','open-weights');
 add('2024-05-16','deepseek','DeepSeek-V2-Lite','https://github.com/deepseek-ai/DeepSeek-V2','open-weight','','open-weights');
 add('2024-06-14','deepseek','DeepSeek-Coder-V2',ds,'coding','API availability precedes the June 17 open-weight announcement.');
 add('2024-09-05','deepseek','DeepSeek-V2.5',ds);
 add('2024-11-20','deepseek','DeepSeek-R1-Lite-Preview','https://api-docs.deepseek.com/news/news1120','general','Web reasoning preview.','public-preview');
 add('2024-12-26','deepseek','DeepSeek-V3',ds);
 add('2025-01-20','deepseek','DeepSeek-R1','https://api-docs.deepseek.com/news/news250120/');
 add('2025-03-24','deepseek','DeepSeek-V3-0324',ds,'revision','Explicit model upgrade; optional revision category.');
 add('2025-05-28','deepseek','DeepSeek-R1-0528',ds,'revision','Explicit model upgrade; optional revision category.');
 add('2025-08-21','deepseek','DeepSeek-V3.1',ds);
 add('2025-09-22','deepseek','DeepSeek-V3.1-Terminus',ds,'revision');
 add('2025-09-29','deepseek','DeepSeek-V3.2-Exp',ds,'general','','public-preview');
 add('2025-12-01','deepseek','DeepSeek-V3.2|DeepSeek-V3.2-Speciale',ds,'general','Speciale is a separate named checkpoint, with a temporary API endpoint.');
 add('2026-04-24','deepseek','DeepSeek-V4-Pro|DeepSeek-V4-Flash',ds,'general','First preview; July/August GA upgrades are not counted as new model families.','public-preview');
 add('2026-08-21','deepseek','DeepSeek-V4-Flash-Vision-Exp',ds,'general','','public-preview');
 add('2026-09-10','deepseek','DeepSeek-V4.1-Flash',ds);

 add('2023-06-25','zai','ChatGLM2-6B','https://github.com/zai-org/ChatGLM-6B','open-weight','Dated upstream release notice; earlier ChatGLM releases are not exhaustively covered.','open-weights');
 add('2024-06-05','zai','GLM-4-9B|GLM-4-9B-Chat-1M|GLM-4V-9B','https://github.com/zai-org/GLM-4','open-weight','Base/chat implementation formats are grouped; 1M and vision are separate named variants.','open-weights');
 add('2025-04-14','zai','GLM-4-32B-0414|GLM-Z1-32B-0414','https://github.com/zai-org/GLM-4','open-weight','Rumination/deep-research variant excluded.','open-weights');
 add('2025-07-02','zai','GLM-4.1V-9B-Thinking','https://github.com/zai-org/GLM-4','open-weight','','open-weights');
 add('2025-07-28','zai','GLM-4.5|GLM-4.5-Air','https://z.ai/blog/glm-4.5');
 for(const [date,name] of [['2025-08-11','GLM-4.5V'],['2025-09-30','GLM-4.6'],['2025-12-08','GLM-4.6V'],['2025-12-22','GLM-4.7'],['2026-01-19','GLM-4.7-Flash'],['2026-02-12','GLM-5'],['2026-04-07','GLM-5.1'],['2026-06-16','GLM-5.2'],['2026-08-18','GLM-5.3'],['2026-08-26','GLM-5.3-Flash']])add(date,'zai',name,glm);

 const kimi='https://www.kimi.com/en/blog/';
 for(const [date,name,slug,category] of [['2025-01-20','Kimi K1.5','kimi-k1-5','general'],['2025-06-17','Kimi-Dev','kimi-dev','coding'],['2025-07-11','Kimi K2','kimi-k2','general'],['2025-09-05','Kimi K2 Instruct 0905','kimi-k2-instruct-0905','revision'],['2025-11-06','Kimi K2 Thinking','kimi-k2-thinking','general'],['2026-01-27','Kimi K2.5','kimi-k2-5','general'],['2026-04-20','Kimi K2.6','kimi-k2-6','general'],['2026-07-16','Kimi K3','kimi-k3','general']])add(date,'moonshot',name,kimi,category,`Dated official research index; article: ${kimi+slug}.${name==='Kimi K3'?' K3 was available in the app/API before its July 27 weights release.':''}`);

 add('2023-02-24','meta','LLaMA 7B|LLaMA 13B|LLaMA 33B|LLaMA 65B','https://ai.meta.com/blog/large-language-model-llama-meta-ai/','open-weight','Research access by application under a noncommercial licence.','gated-weights');
 add('2023-07-18','meta','Llama 2 7B|Llama 2 13B|Llama 2 70B','https://ai.meta.com/blog/llama-2/','open-weight','Base/chat variants grouped per size; no unreleased 34B.','open-weights');
 add('2024-04-18','meta','Llama 3 8B|Llama 3 70B','https://ai.meta.com/blog/meta-llama-3','open-weight','','open-weights');
 add('2024-07-23','meta','Llama 3.1 8B|Llama 3.1 70B|Llama 3.1 405B','https://ai.meta.com/blog/meta-llama-3-1/','open-weight','','open-weights');
 add('2024-09-25','meta','Llama 3.2 1B|Llama 3.2 3B|Llama 3.2 11B|Llama 3.2 90B','https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/','open-weight','','open-weights');
 add('2024-12-06','meta','Llama 3.3 70B','https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct','open-weight','Release date from official model card.','open-weights');
 add('2025-04-05','meta','Llama 4 Scout|Llama 4 Maverick','https://ai.meta.com/blog/llama-4-multimodal-intelligence/','open-weight','Behemoth was previewed but not released, so is omitted.','open-weights');

 add('2023-09-27','mistral','Mistral 7B','https://mistral.ai/news/announcing-mistral-7b/','open-weight','','open-weights');
 add('2024-02-26','mistral','Mistral Large','https://mistral.ai/news/mistral-large/');
 for(const [date,names,category] of [
 ['2024-05-29','Codestral','coding'],['2024-07-16','Codestral Mamba','coding'],['2024-07-18','Mistral NeMo','open-weight'],['2024-07-24','Mistral Large 2','general'],['2024-11-18','Pixtral Large|Mistral Large 2.1','general'],
 ['2025-01-30','Mistral Small 3','general'],['2025-02-17','Mistral Saba','general'],['2025-03-17','Mistral Small 3.1','general'],['2025-05-07','Mistral Medium 3','general'],['2025-05-21','Devstral Small','coding'],['2025-06-10','Magistral Small|Magistral Medium','general'],['2025-06-20','Mistral Small 3.2','general'],['2025-07-10','Devstral Small 1.1|Devstral Medium','coding'],['2025-08-12','Mistral Medium 3.1','general'],['2025-12-02','Mistral Large 3|Ministral 3 3B|Ministral 3 8B|Ministral 3 14B','open-weight'],['2025-12-09','Devstral 2|Devstral Small 2','coding'],['2026-03-16','Mistral Small 4','general'],['2026-03-16','Leanstral','coding'],['2026-04-28','Mistral Medium 3.5','general'],['2026-06-30','Leanstral 1.5','coding']])add(date,'mistral',names,mistral,category);

 add('2023-11-03','xai','Grok-1','https://x.ai/news/grok','general','Early beta for a limited set of US users; open-weight release March 2024 not counted twice.','limited-beta');
 add('2024-08-13','xai','Grok-2|Grok-2 mini','https://x.ai/news/grok-2','general','Beta rollout on X.','public-preview');
 add('2025-07-09','xai','Grok 4','https://x.ai/news/grok-4','general','Heavy inference mode is not counted separately.');
 add('2025-08-28','xai','Grok Code Fast 1','https://x.ai/news/grok-code-fast-1','coding');
 add('2025-09-19','xai','Grok 4 Fast','https://x.ai/news/grok-4-fast','general','Distinct smaller trained model, not merely faster serving.');
 add('2025-11-17','xai','Grok 4.1','https://x.ai/news/grok-4-1','general','Named selectable release. Anonymous preliminary builds were silently tested November 1–14; that interval is not assigned a fabricated single launch day.');
 add('2026-07-08','xai','Grok 4.5','https://docs.x.ai/developers/release-notes','general','API changelog availability July 8 precedes later July consumer/marketing announcements.');
 add('2026-08-12','xai','Grok 4.6','https://x.ai/news/grok-4-6');
 add('2026-09-20','xai','Grok 4.7','https://x.ai/build/changelog','general','Grok Build v1.0.40 dated September 20 confirms access before the September 21 API announcement. Fast serving is not another model.');

 const qw=slug=>`https://qwenlm.github.io/blog/${slug}/`;
 add('2023-08-03','alibaba','Qwen 7B',qw('qwen'),'open-weight','Date from release table, not January 2024 retrospective blog date.','open-weights');
 add('2023-09-25','alibaba','Qwen 14B',qw('qwen'),'open-weight','','open-weights');
 add('2023-11-30','alibaba','Qwen 1.8B|Qwen 72B',qw('qwen'),'open-weight','','open-weights');
 add('2024-02-04','alibaba','Qwen1.5 0.5B|Qwen1.5 1.8B|Qwen1.5 4B|Qwen1.5 7B|Qwen1.5 14B|Qwen1.5 72B',qw('qwen1.5'),'open-weight','Initial six sizes from the original release summary; later 32B/110B not backdated.','open-weights');
 add('2024-06-07','alibaba','Qwen2 0.5B|Qwen2 1.5B|Qwen2 7B|Qwen2 57B-A14B|Qwen2 72B',qw('qwen2'),'open-weight','','open-weights');
 add('2024-09-19','alibaba','Qwen2.5 0.5B|Qwen2.5 1.5B|Qwen2.5 3B|Qwen2.5 7B|Qwen2.5 14B|Qwen2.5 32B|Qwen2.5 72B',qw('qwen2.5'),'open-weight','','open-weights');
 add('2025-04-29','alibaba','Qwen3 0.6B|Qwen3 1.7B|Qwen3 4B|Qwen3 8B|Qwen3 14B|Qwen3 32B|Qwen3 30B-A3B|Qwen3 235B-A22B',qw('qwen3'),'open-weight','Thinking/non-thinking modes grouped; base/instruct exports grouped per size.','open-weights');
 add('2026-02-15','alibaba','Qwen3.5 397B-A17B|Qwen3.5 Plus','https://qwen.ai/blog?id=qwen3.5','general','Original blog date; open checkpoint and distinct hosted Plus variant.');
 add('2026-08-02','alibaba','Qwen3.8 Max','https://qwen.ai/blog?id=qwen3.8','general','Official Qwen launch video dated August 2 confirms app and API access: https://www.youtube.com/watch?v=CKlK-KDFKjM.');
}
