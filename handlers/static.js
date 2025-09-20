import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, context) => {
  try {
    // Serve the main HTML file for all routes
    const htmlPath = join(__dirname, '..', 'public', 'index.html');
    const htmlContent = readFileSync(htmlPath, 'utf8');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
      body: htmlContent,
    };
  } catch (err) {
    console.error('Static handler error:', err);
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
      body: '<h1>404 - Page Not Found</h1>',
    };
  }
};
