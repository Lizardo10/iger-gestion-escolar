import type { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';

// Mock OpenAI implementation - reemplazar con OpenAI SDK real
async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY no configurada, usando mock');
    return `Respuesta generada para: ${prompt}`;
  }

  // TODO: Implementar llamada real a OpenAI
  // const openai = new OpenAI({ apiKey });
  // const completion = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: systemPrompt || "Eres un asistente educativo." },
  //     { role: "user", content: prompt }
  //   ],
  // });
  // return completion.choices[0].message.content || '';

  return 'Respuesta de OpenAI (mock - configurar API key)';
}

export async function summarize(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      taskId: string;
      content: string;
    };

    const systemPrompt = 'Eres un asistente que genera resúmenes educativos concisos y claros.';
    const prompt = `Resume el siguiente contenido de manera clara y concisa:\n\n${body.content}`;

    const summary = await callOpenAI(prompt, systemPrompt);

    return successResponse({
      summary,
      taskId: body.taskId,
    });
  } catch (error) {
    console.error('Error en summarize:', error);
    return errorResponse('Error en summarize: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function tutor(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      studentId: string;
      question: string;
      context: string;
    };

    const systemPrompt = `Eres un tutor inteligente y paciente. Ayudas a estudiantes explicando conceptos de manera clara y simple. Contexto: ${body.context}`;
    const prompt = `Pregunta del estudiante: ${body.question}\n\nResponde de manera clara y educativa.`;

    const answer = await callOpenAI(prompt, systemPrompt);

    return successResponse({
      answer,
      studentId: body.studentId,
      question: body.question,
      references: [
        { title: 'Referencia adicional', url: '#' },
      ],
    });
  } catch (error) {
    console.error('Error en tutor:', error);
    return errorResponse('Error en tutor: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function generateContent(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      subject: string;
      topic: string;
      gradeLevel: string;
      type: string;
    };

    const systemPrompt = `Eres un generador de contenido educativo para estudiantes de ${body.gradeLevel}.`;
    const prompt = `Genera contenido de tipo "${body.type}" sobre "${body.topic}" en la asignatura "${body.subject}".`;

    const content = await callOpenAI(prompt, systemPrompt);

    return successResponse({
      content,
      subject: body.subject,
      topic: body.topic,
      gradeLevel: body.gradeLevel,
      type: body.type,
    });
  } catch (error) {
    console.error('Error en generateContent:', error);
    return errorResponse('Error en generateContent: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

