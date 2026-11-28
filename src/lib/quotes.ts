// Frases motivacionales originales para Fluye (en/es). Sin citas de terceros.

export type Quote = {
  en: string;
  es: string;
  theme: "porque" | "constancia" | "errores" | "canada" | "voz" | "progreso";
};

export const QUOTES: Quote[] = [
  // porque
  { theme: "porque", en: "English can open the door to a job you really want.", es: "El inglés puede abrirte la puerta a un trabajo que de verdad quieres." },
  { theme: "porque", en: "One day you will watch your favorite show without subtitles.", es: "Un día vas a ver tu serie favorita sin subtítulos." },
  { theme: "porque", en: "Every new word is one more thing you can do on your own.", es: "Cada palabra nueva es una cosa más que puedes hacer por tu cuenta." },
  { theme: "porque", en: "Learning English today means less stress at the bank, the doctor and the store.", es: "Aprender inglés hoy es menos estrés en el banco, con el doctor y en la tienda." },
  { theme: "porque", en: "You are not only learning a language. You are building your next home.", es: "No solo estás aprendiendo un idioma. Estás construyendo tu próximo hogar." },
  { theme: "porque", en: "Imagine saying hello to your neighbours and really talking with them.", es: "Imagina saludar a tus vecinos y platicar con ellos de verdad." },
  { theme: "porque", en: "English gives you more choices: more jobs, more friends, more places.", es: "El inglés te da más opciones: más trabajos, más amigos, más lugares." },
  { theme: "porque", en: "When you can ask for help in English, a new city feels smaller.", es: "Cuando puedes pedir ayuda en inglés, una ciudad nueva se siente menos grande." },
  { theme: "porque", en: "Your future self will thank you for the ten minutes you study today.", es: "Tu yo del futuro te va a agradecer los diez minutos que estudies hoy." },
  { theme: "porque", en: "Understanding the song is better than just singing the sounds.", es: "Entender la canción es mejor que solo cantar los sonidos." },
  { theme: "porque", en: "With English, you can share your ideas at work, not just follow instructions.", es: "Con inglés puedes compartir tus ideas en el trabajo, no solo seguir instrucciones." },
  { theme: "porque", en: "You learn so you can fill out the form and make the call without waiting for anyone.", es: "Aprendes para llenar el formulario y hacer la llamada sin depender de nadie." },
  { theme: "porque", en: "A new language is a new way to tell people who you are.", es: "Un idioma nuevo es una forma nueva de contarle a la gente quién eres." },
  { theme: "porque", en: "You chose this goal together. Every lesson is a step for both of you.", es: "Eligieron esta meta juntos. Cada lección es un paso para los dos." },
  { theme: "porque", en: "With English, the news, the movies and the internet get much bigger.", es: "Con inglés, las noticias, las películas e internet se vuelven mucho más grandes." },
  { theme: "porque", en: "Think of the first coffee you will order there without practicing it ten times.", es: "Piensa en el primer café que vas a pedir allá sin ensayarlo diez veces." },
  { theme: "porque", en: "Your Spanish is a treasure. English is one more tool next to it.", es: "Tu español es un tesoro. El inglés es una herramienta más a su lado." },
  { theme: "porque", en: "The reason you started is still true today.", es: "La razón por la que empezaste sigue siendo cierta hoy." },
  { theme: "porque", en: "More English means more interviews you can say yes to.", es: "Más inglés significa más entrevistas a las que puedes decir que sí." },
  { theme: "porque", en: "You want to understand the jokes, not only the words. That is why you practice.", es: "Quieres entender los chistes, no solo las palabras. Por eso practicas." },

  // constancia
  { theme: "constancia", en: "Ten minutes every day beat two hours once a week.", es: "Diez minutos diarios le ganan a dos horas una vez por semana." },
  { theme: "constancia", en: "A small lesson today is better than a perfect lesson someday.", es: "Una lección pequeña hoy es mejor que una lección perfecta algún día." },
  { theme: "constancia", en: "You do not need a lot of time. You need a little time, many days.", es: "No necesitas mucho tiempo. Necesitas un poco de tiempo, muchos días." },
  { theme: "constancia", en: "On busy days, one exercise still counts.", es: "En los días ocupados, un solo ejercicio también cuenta." },
  { theme: "constancia", en: "Your brain learns better in small pieces.", es: "Tu cerebro aprende mejor en pedacitos." },
  { theme: "constancia", en: "Missing one day is normal. Coming back tomorrow is what matters.", es: "Faltar un día es normal. Lo importante es volver mañana." },
  { theme: "constancia", en: "Practice like you brush your teeth: short, daily and without drama.", es: "Practica como te lavas los dientes: rápido, diario y sin drama." },
  { theme: "constancia", en: "Words you see many times start to feel like yours.", es: "Las palabras que ves muchas veces empiezan a sentirse tuyas." },
  { theme: "constancia", en: "Today does not have to be amazing. It just has to happen.", es: "Hoy no tiene que ser increíble. Solo tiene que pasar." },
  { theme: "constancia", en: "Five minutes in the morning can set the tone for the whole day.", es: "Cinco minutos en la mañana pueden marcar el tono de todo el día." },
  { theme: "constancia", en: "The days you do not feel like it are the days that build the habit.", es: "Los días que no tienes ganas son los que construyen el hábito." },
  { theme: "constancia", en: "Slow and steady still gets you there.", es: "Despacio y constante, igual llegas." },
  { theme: "constancia", en: "Study a little with your coffee, a little on the bus, a little before dinner.", es: "Estudia un poco con tu café, un poco en el camión, un poco antes de cenar." },
  { theme: "constancia", en: "One more day on the calendar is one more brick in the wall.", es: "Un día más en el calendario es un ladrillo más en la pared." },
  { theme: "constancia", en: "You don't have to finish the book. Just open it today.", es: "No tienes que terminar el libro. Solo ábrelo hoy." },
  { theme: "constancia", en: "Small habits are quiet, but they are strong.", es: "Los hábitos pequeños son silenciosos, pero son fuertes." },
  { theme: "constancia", en: "Do the easy lesson. Easy days keep your streak alive too.", es: "Haz la lección fácil. Los días fáciles también mantienen la racha." },
  { theme: "constancia", en: "Repeating is not boring. Repeating is how words stay.", es: "Repetir no es aburrido. Repetir es como se quedan las palabras." },
  { theme: "constancia", en: "If today is hard, make the goal smaller, not zero.", es: "Si hoy está difícil, haz la meta más chica, no cero." },
  { theme: "constancia", en: "Months of small days will surprise you.", es: "Meses de días pequeños te van a sorprender." },

  // errores
  { theme: "errores", en: "Every mistake shows you exactly what to practice next.", es: "Cada error te muestra justo qué practicar después." },
  { theme: "errores", en: "People will understand you, even with a few mistakes.", es: "La gente te va a entender, aunque cometas algunos errores." },
  { theme: "errores", en: "A wrong answer today is a right answer next week.", es: "Una respuesta mal hoy es una respuesta bien la próxima semana." },
  { theme: "errores", en: "Mistakes mean you are trying. Silence means you are not.", es: "Los errores significan que lo estás intentando. El silencio, que no." },
  { theme: "errores", en: "Your accent is part of your story. Keep it and keep talking.", es: "Tu acento es parte de tu historia. Consérvalo y sigue hablando." },
  { theme: "errores", en: "Nobody learned to ride a bike without falling a little.", es: "Nadie aprendió a andar en bici sin caerse un poquito." },
  { theme: "errores", en: "Say it wrong, then say it again. That is the whole method.", es: "Dilo mal, luego dilo otra vez. Ese es todo el método." },
  { theme: "errores", en: "Perfect English is not the goal. Clear English is.", es: "La meta no es un inglés perfecto. Es un inglés claro." },
  { theme: "errores", en: "Most people are kind when you are learning. Let them help you.", es: "Casi toda la gente es amable cuando estás aprendiendo. Deja que te ayuden." },
  { theme: "errores", en: "If you laugh at your mistake, you will remember the right word.", es: "Si te ríes de tu error, vas a recordar la palabra correcta." },
  { theme: "errores", en: "Native speakers make mistakes too. They just keep talking.", es: "Los hablantes nativos también se equivocan. Simplemente siguen hablando." },
  { theme: "errores", en: "A red mark is not a grade on you. It is a map.", es: "Una marca roja no es una calificación sobre ti. Es un mapa." },
  { theme: "errores", en: "Getting it wrong in practice helps you not get stuck in real life.", es: "Equivocarte al practicar te ayuda a no atorarte en la vida real." },
  { theme: "errores", en: "Every \"sorry, can you repeat that?\" is part of learning.", es: "Cada «perdón, ¿lo puedes repetir?» es parte de aprender." },
  { theme: "errores", en: "You can fix a sentence. You cannot fix a sentence you never said.", es: "Puedes corregir una frase. No puedes corregir una frase que nunca dijiste." },
  { theme: "errores", en: "Mixing up past and present is normal at your level. Keep going.", es: "Confundir el pasado y el presente es normal en tu nivel. Sigue adelante." },
  { theme: "errores", en: "Mistakes are not steps back. They are steps you can see.", es: "Los errores no son pasos atrás. Son pasos que puedes ver." },
  { theme: "errores", en: "When one of you makes a mistake, both of you learn something.", es: "Cuando uno de los dos se equivoca, los dos aprenden algo." },
  { theme: "errores", en: "A simple sentence with errors is better than no sentence at all.", es: "Una frase sencilla con errores es mejor que ninguna frase." },
  { theme: "errores", en: "Many fluent speakers once said \"I am agree\". Now they don't.", es: "Mucha gente que hoy habla con soltura alguna vez dijo «I am agree». Ya no." },

  // canada
  { theme: "canada", en: "Snowy mornings feel warmer when you can chat with your neighbours.", es: "Las mañanas con nieve se sienten más cálidas cuando puedes platicar con tus vecinos." },
  { theme: "canada", en: "Canadian winters are cold, but conversations can be warm.", es: "Los inviernos en Canadá son fríos, pero las conversaciones pueden ser cálidas." },
  { theme: "canada", en: "Picture your first walk in the snow, with a warm coat, a hot drink and new words.", es: "Imagina tu primera caminata en la nieve, con un buen abrigo, algo caliente y palabras nuevas." },
  { theme: "canada", en: "In a new country, English helps you find your community.", es: "En un país nuevo, el inglés te ayuda a encontrar tu comunidad." },
  { theme: "canada", en: "Edmonton is getting closer, one lesson at a time.", es: "Edmonton está cada vez más cerca, una lección a la vez." },
  { theme: "canada", en: "Canada has people from all over the world. Your accent will fit right in.", es: "En Canadá hay gente de todo el mundo. Tu acento va a encajar perfecto." },
  { theme: "canada", en: "Being able to talk to a doctor or a teacher there will give you peace of mind.", es: "Poder hablar con un doctor o un maestro allá te va a dar tranquilidad." },
  { theme: "canada", en: "Today's practice is tomorrow's job interview in Edmonton.", es: "La práctica de hoy es la entrevista de trabajo de mañana en Edmonton." },
  { theme: "canada", en: "A new city is easier when you can read the signs and ask for directions.", es: "Una ciudad nueva es más fácil cuando puedes leer los letreros y preguntar cómo llegar." },
  { theme: "canada", en: "Every phrase you learn is one less worry at the airport.", es: "Cada frase que aprendes es una preocupación menos en el aeropuerto." },
  { theme: "canada", en: "Learn the words for cold: freezing, chilly, frost. You will use them.", es: "Aprende las palabras del frío: freezing, chilly, frost. Las vas a usar." },
  { theme: "canada", en: "Small talk about the weather is a real skill there. Start practicing.", es: "Platicar del clima es una habilidad real allá. Empieza a practicar." },
  { theme: "canada", en: "\"Sorry\" and \"thank you\" open many doors. Say them often.", es: "«Sorry» y «thank you» abren muchas puertas. Dilos seguido." },
  { theme: "canada", en: "Think of the friends you have not met yet. They speak English.", es: "Piensa en los amigos que todavía no conoces. Hablan inglés." },
  { theme: "canada", en: "Your new home will feel like home faster if you understand it.", es: "Tu nuevo hogar se va a sentir como hogar más rápido si lo entiendes." },
  { theme: "canada", en: "Long winter nights are perfect for movies in English.", es: "Las noches largas de invierno son perfectas para ver películas en inglés." },
  { theme: "canada", en: "There, you will order, ask, explain and joke in English. Practice each one here.", es: "Allá vas a pedir, preguntar, explicar y bromear en inglés. Practica cada cosa aquí." },
  { theme: "canada", en: "Opportunities grow when you can tell people what you know how to do.", es: "Las oportunidades crecen cuando puedes decirle a la gente lo que sabes hacer." },
  { theme: "canada", en: "A new start in a new country takes courage. You already have it.", es: "Empezar de nuevo en otro país requiere valor. Ya lo tienes." },
  { theme: "canada", en: "Bring your Mexican warmth to Canada. Bring your English too.", es: "Lleva tu calidez mexicana a Canadá. Y lleva también tu inglés." },

  // voz
  { theme: "voz", en: "Read one sentence out loud today. Your mouth needs practice too.", es: "Lee una frase en voz alta hoy. Tu boca también necesita práctica." },
  { theme: "voz", en: "Your voice in English only sounds strange at the beginning.", es: "Tu voz en inglés solo suena rara al principio." },
  { theme: "voz", en: "Speak slowly. Slow and clear is better than fast and nervous.", es: "Habla despacio. Lento y claro es mejor que rápido y con nervios." },
  { theme: "voz", en: "Talk to yourself in English while you cook. Nobody is grading you.", es: "Háblate en inglés mientras cocinas. Nadie te está calificando." },
  { theme: "voz", en: "Confidence comes after you speak, not before.", es: "La confianza llega después de hablar, no antes." },
  { theme: "voz", en: "Practice with each other at home. It is the safest place to sound silly.", es: "Practiquen juntos en casa. Es el lugar más seguro para sonar chistoso." },
  { theme: "voz", en: "Say the new word out loud three times. Now it belongs to you.", es: "Di la palabra nueva en voz alta tres veces. Ahora es tuya." },
  { theme: "voz", en: "Record yourself today. In a month, you will hear the difference.", es: "Grábate hoy. En un mes vas a notar la diferencia." },
  { theme: "voz", en: "Your ideas are good in Spanish. They are good in English too.", es: "Tus ideas son buenas en español. También lo son en inglés." },
  { theme: "voz", en: "Feeling nervous is normal. Speak anyway.", es: "Los nervios son normales. Habla de todos modos." },
  { theme: "voz", en: "A short answer in English is still an answer in English.", es: "Una respuesta corta en inglés sigue siendo una respuesta en inglés." },
  { theme: "voz", en: "Take a breath, smile and start with \"Hi\".", es: "Respira, sonríe y empieza con un «Hi»." },
  { theme: "voz", en: "You don't need big words to be heard. You need your words.", es: "No necesitas palabras rebuscadas para que te escuchen. Necesitas las tuyas." },
  { theme: "voz", en: "Every time you speak, the next time gets easier.", es: "Cada vez que hablas, la siguiente es más fácil." },
  { theme: "voz", en: "Sing along, read aloud, order in English. Your voice is training.", es: "Canta, lee en voz alta, pide en inglés. Tu voz está entrenando." },
  { theme: "voz", en: "If you can say it to the mirror, you can say it to a person.", es: "Si se lo puedes decir al espejo, se lo puedes decir a una persona." },
  { theme: "voz", en: "Ask one question in English today. Just one.", es: "Haz una pregunta en inglés hoy. Solo una." },
  { theme: "voz", en: "Your voice deserves space in every language you speak.", es: "Tu voz merece espacio en cada idioma que hablas." },
  { theme: "voz", en: "Speaking is a muscle. Use it a little every day.", es: "Hablar es un músculo. Úsalo un poco cada día." },
  { theme: "voz", en: "Don't wait to feel ready. Speaking is how you get ready.", es: "No esperes a sentir que ya puedes. Hablando es como te preparas." },

  // progreso
  { theme: "progreso", en: "Remember when this was hard? Look at you now.", es: "¿Te acuerdas de cuando esto era difícil? Mírate ahora." },
  { theme: "progreso", en: "Today you understood something you didn't understand last month.", es: "Hoy entendiste algo que el mes pasado no entendías." },
  { theme: "progreso", en: "Celebrate small wins: one new word, one clear sentence, one good day.", es: "Celebra los logros pequeños: una palabra nueva, una frase clara, un buen día." },
  { theme: "progreso", en: "Progress is quiet. Write it down so you can see it.", es: "El progreso es silencioso. Escríbelo para poder verlo." },
  { theme: "progreso", en: "You read that without translating. That is real progress.", es: "Leíste eso sin traducir. Eso es progreso real." },
  { theme: "progreso", en: "Compare yourself with last week, not with other people.", es: "Compárate con la semana pasada, no con otras personas." },
  { theme: "progreso", en: "Every lesson you finish is proof that you can do this.", es: "Cada lección que terminas es prueba de que sí puedes." },
  { theme: "progreso", en: "You understood a joke in English? That counts. A lot.", es: "¿Entendiste un chiste en inglés? Eso cuenta. Y mucho." },
  { theme: "progreso", en: "Look back at your first journal entry. You have come a long way.", es: "Vuelve a leer tu primera entrada del diario. Has avanzado un montón." },
  { theme: "progreso", en: "Some days you climb, some days you rest. Both are part of the way up.", es: "Algunos días subes y otros descansas. Las dos cosas son parte del camino." },
  { theme: "progreso", en: "A word you looked up last week is now a word you just know.", es: "Una palabra que buscaste la semana pasada hoy simplemente la sabes." },
  { theme: "progreso", en: "Your level is not a label. It is just where you are today.", es: "Tu nivel no es una etiqueta. Solo es donde estás hoy." },
  { theme: "progreso", en: "Notice the moments: a song you got, a sign you read, a word you heard.", es: "Fíjate en los momentos: una canción que entendiste, un letrero que leíste, una palabra que oíste." },
  { theme: "progreso", en: "Getting a little better every week adds up to a lot.", es: "Mejorar un poco cada semana suma muchísimo." },
  { theme: "progreso", en: "Give yourself credit. Learning a language as an adult takes guts.", es: "Reconoce tu esfuerzo. Aprender un idioma de adulto requiere agallas." },
  { theme: "progreso", en: "Celebrate together when one of you gets better. You are a team.", es: "Celebren juntos cuando uno de los dos mejore. Son un equipo." },
  { theme: "progreso", en: "Today's easy exercise was yesterday's hard one.", es: "El ejercicio fácil de hoy fue el difícil de ayer." },
  { theme: "progreso", en: "You are closer to your goal than you were this morning.", es: "Estás más cerca de tu meta que esta mañana." },
  { theme: "progreso", en: "Feeling stuck is normal. Keep going and the next jump will come.", es: "Sentir que no avanzas es normal. Sigue y el siguiente salto va a llegar." },
  { theme: "progreso", en: "Finished today's practice? That is a win. Enjoy it.", es: "¿Terminaste la práctica de hoy? Eso es un logro. Disfrútalo." },
];

// FNV-1a de 32 bits: determinista y sin dependencias.
const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

export const quoteOfDay = (day: string): Quote => QUOTES[hash(day) % QUOTES.length];
