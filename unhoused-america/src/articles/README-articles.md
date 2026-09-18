# To add an article
1. In the `/src/articles/article-archive` folder, create a new .md file. 
    - The order of files in the folder is what creates the order on the /articles page. Name your file accordingly
    - You can copy and paste the template into it (`/src/articles/TEMPLATE.md`)
2. Create a folder in `/public/articles/` using the filename as the folder name
3. Paste the article into the .md file
    - Make sure to put the title, authors, author URLs, abstract, and keywords in the top section

## Markdown Instructions

### Creating Citations
`[^1]` creates a link to the reference at the bottom with the same title. Make sure to add `[^1] Citation, which can include any text styling including URLs` at the bottom of the .md file, inside the references section

### Adding Images
`![Alt Text](Image URL)`

### Creating Headers
`## Text` Heading 2
`### Text` Heading 3
`#### Text` Heading 4

### Text Styling
`**Text**` Bold Text
`*Text*` Italicized Text
`> Text` Blockquote
`[Text](https://www.example.com)` Link


# To edit the list of articles
Everything you need to edit should be in `articles-list.js`. It's a super basic view right now and you may want to add filtering or some logic to display things.