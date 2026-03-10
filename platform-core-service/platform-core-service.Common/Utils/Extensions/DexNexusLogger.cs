using System.Reflection;
using System.Xml;
using log4net;
using log4net.Repository.Hierarchy;

namespace platform_core_service.Common.Utils.Extensions
{
    public static class DevNexusLogger
    {
        private static readonly string LOG_CONFIG_FILE = @"log4net.config";

        private static ILog mInstance;
        public static ILog Instance
        {
            get
            {

                if (mInstance == null)
                {
                    SetLog4NetConfiguration();
                    mInstance = LogManager.GetLogger(typeof(Logger));
                }
                return mInstance;
            }
            set { mInstance = value; }
        }

        private static void SetLog4NetConfiguration()
        {
            XmlDocument log4netConfig = new XmlDocument();
            log4netConfig.Load(File.OpenRead(LOG_CONFIG_FILE));

            var repo = LogManager.CreateRepository(
                Assembly.GetEntryAssembly(), typeof(Hierarchy));

            log4net.Config.XmlConfigurator.Configure(repo, log4netConfig["log4net"]);
        }
    }
}