# Unhoused America
A project on homelessness in America, under Dana McKinney White, Assistant Professor of Urban Design at Harvard Graduate School of Design


# Instructions to view the front end

## 1. Make sure you have node.js
Check if you have a version of node.js on your computer:
1. In the windows search bar, search for 'terminal' and open that program
2. Enter the command `node -v`
3. Enter the command `npm -v`
If you have it installed, the command `node -v` should return something like `v.22.15.1` and the command `npm -v` should return something like `10.9.1`. Don't worry too much if the numbers aren't the same--I don't think I'm doing anything too wild that won't work with most verisons

If you don't have node.js installed, you'll likely get an error returned that says something like `'node' is not recognized as an internal or external command, operable program or batch file`. To fix this, download the driver from here: https://nodejs.org/en/download/. Ignore the big code window at the top and focus on the section that starts with 'Or get a prebuilt Node.js® for...'. Select your operating system from the dropdowns and download the installer.

Once you have a version of node installed, you should be good to go!

## 2. Download the github repo (i.e. all the files)
This can be done in a few different ways. 

### Github Desktop (recommended)
I recommend this because you can easily update it when I make changes
https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-a-repository-from-github-to-github-desktop

To update, you'd just open up Github Desktop and select 'fetch origin' or 'pull' in the top bar -- this will grab all the latest changes.

### Just download the file
Download and upzip the file
https://docs.github.com/en/get-started/start-your-journey/downloading-files-from-github#downloading-a-repositorys-files


## 3. Navigate to the file using terminal
You'll need to run some command line prompts in the file to get it to start in the browser

1. In the windows search bar, search for 'terminal' and open that program
2. Navigate to the backend. To do this, you'll type the command: `cd [file path where you saved + unzipped it if needed]\backend`
3. Enter the command `npm install`
4. Download the .env file (https://hu-my.sharepoint.com/:u:/r/personal/mckinneywhite_gsd_harvard_edu/Documents/Research/Vulernable%20Populations/Unhoused%20America/03_Web%20Content/05_Emodicons/.env?csf=1&web=1&e=9nqyrH) and put it in the backend folder
5. Enter the command `npm start`
6. Navigate to where the frontend is. To do this, you'll type the command: `cd [file path where you saved + unzipped it if needed]\unhoused-america` (you'll notice that there's a folder inside the main one you download called 'unhoused-america' and that's the folder we need to run the commands in). For me, I used Github Desktop to save it to my 'documents' folder, so my full command I'd use is `cd C:\Users\zkdeo\Documents\Unhoused-America\unhoused-america`. Press enter after you type the command
7. Enter the command `npm install`
8. Enter the command `npm start`
9. A browser window should pop up with the website (see it by visiting `localhost:3000` if it doesn't pop up)

# Backend
`/backend-cloudflare` is where it's currently pulling from

### Updating the Cloudflare backend
For the full deployment and frontend wiring steps, see [CLOUDFLARE_BACKEND_UPDATE.md](CLOUDFLARE_BACKEND_UPDATE.md).

### Embodicons Storage
Embodicons images are stored on Github
Generated stories, names, ages, etc. are all on the backend