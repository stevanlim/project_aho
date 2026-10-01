using System;
using System.IO;
using System.Diagnostics;
using System.Threading;

namespace SSVapeLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                Console.OutputEncoding = System.Text.Encoding.UTF8;
                Console.Title = "SS VAPE - Launcher Otomatis (App + Ngrok)";

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                Directory.SetCurrentDirectory(baseDir);

                string batFile = Path.Combine(baseDir, "JALANKAN_SEMUA (APP + NGROK).bat");

                if (File.Exists(batFile))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c call \"" + batFile + "\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = false
                    };
                    Process proc = Process.Start(psi);
                    if (proc != null)
                    {
                        proc.WaitForExit();
                    }
                }
                else
                {
                    Console.Clear();
                    Console.WriteLine("========================================================");
                    Console.WriteLine("      SS VAPE - LAUNCHER OTOMATIS (APP + NGROK)");
                    Console.WriteLine("========================================================");
                    Console.WriteLine();
                    Console.WriteLine("1. Membuka Server Aplikasi di jendela terpisah...");

                    ProcessStartInfo srvPsi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/k \"title SS VAPE - Server (Localhost:5173) && npm run dev\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = true
                    };
                    Process.Start(srvPsi);

                    Console.WriteLine("Menunggu server Vite siap (3 detik)...");
                    Thread.Sleep(3000);

                    Console.WriteLine();
                    Console.WriteLine("2. Membuka Ngrok Online Tunnel di jendela terpisah...");

                    ProcessStartInfo ngrokPsi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/k \"title SS VAPE - Ngrok Tunnel && ngrok http 127.0.0.1:5173\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = true
                    };
                    Process.Start(ngrokPsi);

                    Console.WriteLine();
                    Console.WriteLine("========================================================");
                    Console.WriteLine("SUKSES: Server lokal dan Ngrok sudah berhasil dijalankan!");
                    Console.WriteLine("Anda dapat mengecek URL online di jendela Ngrok.");
                    Console.WriteLine("========================================================");
                    Console.WriteLine();
                    Console.WriteLine("Jendela launcher ini akan otomatis tertutup dalam 5 detik...");
                    for (int i = 5; i > 0; i--)
                    {
                        Thread.Sleep(1000);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Terjadi kesalahan: " + ex.Message);
                Console.WriteLine("Tekan Enter untuk keluar...");
                Console.ReadLine();
            }
        }
    }
}
