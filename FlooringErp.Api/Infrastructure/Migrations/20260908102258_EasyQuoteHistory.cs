using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlooringErp.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EasyQuoteHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProductSystemName",
                table: "Quotes",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductSystemName",
                table: "Quotes");
        }
    }
}
