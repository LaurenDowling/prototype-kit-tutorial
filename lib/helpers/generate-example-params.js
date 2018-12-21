import * as fs from 'fs';
import chalk from 'chalk';
import nunjucks from 'nunjucks';
import marked from 'marked';
import pretty from 'pretty';

import { NunjucksLoader } from '../nunjucks-loader';
import { removeFrontmatterFromString } from '../remove-frontmatter-from-string';

const sourcePath = `${process.cwd()}/src`;

export function generateExampleParams(path, addDependency) {
  const link = `/${path.replace('/index.njk', '')}`;
  const name = link.split('/examples/')[1];
  path = `${sourcePath}/${path}`;

  if (fs.existsSync(path)) {
    addDependency(path);
    const raw = removeFrontmatterFromString(fs.readFileSync(path, 'utf8'));
    const srcPath = `${path.split('/examples/')[0]}/src/`;
    const optionsPath = `${srcPath}_macro-options.md`;
    const templatePath = `${srcPath}_template.njk`;

    let options;
    let scss;
    let template;

    if (fs.existsSync(optionsPath)) {
      addDependency(optionsPath);
      options = marked(fs.readFileSync(optionsPath, 'utf8'), {
        smartypants: true
      });
    }

    if (fs.existsSync(srcPath)) {
      const sassFiles = fs.readdirSync(srcPath).filter(file => {
        const fileNameParts = file.split('.');
        const ext = fileNameParts[fileNameParts.length - 1];

        return ext === 'scss';
      });

      const sassRaw = sassFiles.map(file => {
        addDependency(`${srcPath}${file}`);
        return fs.readFileSync(`${srcPath}${file}`, 'utf8');
      });
      scss = sassRaw.join('\n');
    }

    if (fs.existsSync(templatePath)) {
      addDependency(templatePath);
      template = `{% raw %}${fs.readFileSync(templatePath, 'utf8')}{% endraw %}`;
    }

    const loader = new NunjucksLoader(sourcePath);
    const environment = new nunjucks.Environment(loader);
    nunjucks.configure(null, {
      watch: false,
      autoescape: true
    });

    const html = pretty(nunjucks.compile(raw, environment).render(), { ocd: true });

    return {
      link,
      raw: `{% raw %}${raw}{% endraw %}`,
      options,
      html,
      scss,
      name,
      template
    };
  } else {
    console.log('');
    console.log(chalk.red(`Path: '${path}' not found.`));
  }
}