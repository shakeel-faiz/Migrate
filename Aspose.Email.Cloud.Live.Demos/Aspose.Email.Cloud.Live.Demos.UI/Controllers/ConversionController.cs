using Aspose.Email.Cloud.Live.Demos.UI.Models;
using Aspose.Email.Cloud.Sdk.Api;
using Aspose.Email.Cloud.Sdk.Model;
using System.IO;
using System.Web.Mvc;

namespace Aspose.Email.Cloud.Live.Demos.UI.Controllers
{
    public class ConversionController : BaseController
    {
        public override string Product => (string)RouteData.Values["product"];

        public EmailCloud EmailCloudApi
        {
            get
            {
                string strEmailCloudSessionKey = Config.Configuration.SessionKeyEmailCloud;
                if (Session[strEmailCloudSessionKey] == null)
                {
                    string clientId = Config.Configuration.ClientId;
                    string clientSecret = Config.Configuration.ClientSecret;

                    Session[strEmailCloudSessionKey] = new EmailCloud(clientSecret: clientSecret, clientId: clientId);
                }

                return Session[strEmailCloudSessionKey] as EmailCloud;
            }
        }

        [HttpPost]
        public Response Conversion(string outputType)
        {
            var postedFile = Request.Files[0];
            string fileName = postedFile.FileName;

            string fromFormat = Path.GetExtension(fileName).Substring(1);
            string toFormat = outputType;
            var file = postedFile.InputStream;
            string outputFileName = Path.GetFileNameWithoutExtension(fileName) + "." + outputType;

            EmailConvertRequest ecr = new EmailConvertRequest()
            {
                File = file,
                FromFormat = fromFormat,
                ToFormat = toFormat
            };

            var result = EmailCloudApi.Email.Convert(ecr);
            Session[Config.Configuration.SessionKeyConvertResult] = result;

            return new Response
            {
                StatusCode = 200,
                FileName = outputFileName
            };
        }
        public ActionResult Conversion()
        {
            var model = new ViewModel(this, "Conversion")
            {
                SaveAsComponent = true,
                MaximumUploadFiles = 1
            };

            return View(model);
        }
    }
}