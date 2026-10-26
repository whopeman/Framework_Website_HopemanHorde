<!--
  README.md
  Project : {{NAME}}
  Date    : {{DATE}}
  Purpose : Overview and deploy notes for a project hosted at
            https://hopemanhorde.com/{{SLUG}}/
  Change log:
    {{DATE}}  0.1.0  Created from the Framework_Website_HopemanHorde template.
-->

# {{NAME}}

{{DESCRIPTION}}

Live at <https://hopemanhorde.com/{{SLUG}}/>.

## Hosting

This project is served from its own folder, `public_html/{{SLUG}}/`, on the
HopemanHorde.com hosting account. It is registered in the main site's
`data/projects.yaml`, which puts it in the home page's project list.

## Deploy

1. Build the project so its static files are in one folder.
2. Copy `deploy.example.json` to `deploy.local.json` (gitignored). Set
   `keyPath` to the deploy key and `sourceDir` to that build folder.
3. From the main site repo (`Framework_Website_HopemanHorde`), run a dry run,
   then the real upload:

   ```sh
   npm run deploy -- -ConfigPath <path-to>/deploy.local.json
   npm run deploy -- -ConfigPath <path-to>/deploy.local.json -Execute
   ```

Project deploys upload only into `public_html/{{SLUG}}/`, use SSH keys only,
and never delete files on the server.
