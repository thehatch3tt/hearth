/**
 * The handbook as a printable PDF (expo-print), shared through the share sheet. Unlike the app, a PDF
 * isn't sealed, so logins and letters are left out unless chosen. Photos go in, with their captions.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { CARE_MESSAGE, SECTIONS } from './content';
import { photoFile } from './media';
import { opensText, type Data, type Photo } from './store';

/** What can go in: each section, the logins page on its own, and the letters. */
export type Part = (typeof SECTIONS)[number]['id'] | 'logins' | 'letters';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paragraphs = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** A page's photos as images inside the PDF itself (a missing file is skipped). */
async function figures(photos: Photo[]) {
  const out: string[] = [];
  for (const photo of photos) {
    const file = photoFile(photo.id);
    if (!file.exists) continue;
    const caption = photo.caption?.trim();
    out.push(`<figure><img src="data:image/jpeg;base64,${await file.base64()}">${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`);
  }
  return out.join('');
}

async function html(data: Data, parts: Set<Part>) {
  const name = data.name.trim() || 'My';
  const chosen = SECTIONS.filter((section) => parts.has(section.id));
  const pictures: Record<string, string> = {};
  for (const page of chosen.flatMap((section) => section.pages)) pictures[page.id] = await figures(data.pages[page.id]?.photos ?? []);
  const sections = chosen.map((section) => {
    const pages = section.pages
      .filter((page) => page.id !== 'logins' || parts.has('logins'))
      .map((page) => {
        const saved = data.pages[page.id];
        const entries = (saved?.entries ?? []).filter((entry) => entry.title.trim() || entry.note.trim());
        const fields = (page.fields ?? []).map((field) => ({ label: field.label, value: saved?.fields?.[field.id]?.trim() ?? '' })).filter((field) => field.value);
        const voice = saved?.voice ?? [];
        const body = saved?.body?.trim();
        const photos = pictures[page.id] ?? '';
        if (!entries.length && !fields.length && !body && !voice.length && !photos) return '';
        return `<section><h3>${escape(page.title)}</h3>
          ${fields.length ? `<ul>${fields.map((field) => `<li><b>${escape(field.label)}:</b> ${escape(field.value)}</li>`).join('')}</ul>` : ''}
          ${entries.length ? `<ul>${entries.map((entry) => `<li><b>${escape(entry.title)}</b>${entry.note.trim() ? ` — ${escape(entry.note)}` : ''}</li>`).join('')}</ul>` : ''}
          ${body ? paragraphs(body) : ''}
          ${photos}
          ${voice.length ? `<p class="note">Voice notes in the app: ${voice.map((note) => escape(note.title)).join(', ')}</p>` : ''}
        </section>`;
      })
      .join('');
    return pages ? `<h2>${escape(section.title)}</h2>${pages}` : '';
  });
  const letters = parts.has('letters')
    ? data.letters
        .filter((letter) => letter.body.trim())
        .map((letter) => `<section class="letter"><h3>To ${escape(letter.to || 'someone')}</h3><p class="note">${escape(opensText(letter.opens))}</p>${paragraphs(letter.body)}</section>`)
        .join('')
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { margin: 54pt 60pt; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1c1a22; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 26pt; font-weight: 300; margin: 0 0 4pt; }
    .sub { color: #6b6576; margin: 0 0 22pt; }
    h2 { font-size: 16pt; font-weight: 500; border-bottom: 1px solid #d9d4e0; padding-bottom: 4pt; margin: 26pt 0 10pt; page-break-after: avoid; }
    h3 { font-size: 12.5pt; font-weight: 600; margin: 14pt 0 4pt; page-break-after: avoid; }
    section { page-break-inside: avoid; }
    p { margin: 0 0 8pt; }
    ul { margin: 0 0 8pt; padding-left: 16pt; }
    .note { color: #6b6576; font-size: 10.5pt; }
    .care { background: #f4f1ea; padding: 12pt 14pt; border-radius: 6pt; margin-bottom: 8pt; }
    .letter { page-break-before: always; }
    figure { margin: 6pt 0 10pt; page-break-inside: avoid; }
    img { max-width: 100%; max-height: 300pt; border-radius: 4pt; }
    figcaption { color: #6b6576; font-size: 10.5pt; margin-top: 3pt; }
  </style></head><body>
    <h1>${escape(name === 'My' ? 'My handbook' : `${name}'s handbook`)}</h1>
    <p class="sub">Made with Left in Love on ${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}. Keep it somewhere safe.</p>
    <div class="care">${escape(CARE_MESSAGE)}</div>
    ${sections.join('')}
    ${letters ? `<h2>Letters</h2>${letters}` : ''}
  </body></html>`;
}

/** Makes the PDF and opens the share sheet (Messages, Mail, AirDrop, Print, Save to Files). */
export async function sharePdf(data: Data, parts: Set<Part>) {
  const { uri } = await Print.printToFileAsync({ html: await html(data, parts), width: 612, height: 792 });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Your handbook' });
}
