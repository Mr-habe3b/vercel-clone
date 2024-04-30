const { } = require('child_process')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')


const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({

    credentials: {
        region: 'apt-south-1',
        accessKeyId: 'entry your access key here',
        secretAccessKey: 'entry your secret key here'
    },
})

const PROJECT_ID = process.env.PROJECT_ID

async function init() {
    console.log('executing script.js');
    const outDirPath = path.join(__dirname, 'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build `)

    p.stdout.on('data', function (data) {
        console.log(data.toString())
    })


    p.stdout.on('error', function (data) {
        console.log(data.toString())
    })

    p.on('close', async function () {
        console.log('Build process completed')
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContent = await readdir(distFolderPath, { recursive: true })
        for (const filePath of distFolderContent) {
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading file to s3', filePath);


            const command = new PutObjectCommand({
                Bucket: 'vercel-clone-projects1',
                Key: `__output/${PROJECT_ID}/${filePath}`,
                Body: fs.createReadStream(filePath),
                contentType: mime.lookup(filePath)
            })

            await s3Client.send(command)
            console.log('Uploaded file to s3', filePath);
        }
        console.log('Done...')
    })
}

init()